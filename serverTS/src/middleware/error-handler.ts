import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError || process.env.NODE_ENV !== 'production'
      ? err.message
      : 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.path} ->`, err);

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
