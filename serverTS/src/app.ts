import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";

const app: Express = express();

app.use(helmet())
app.use(cors({
    origin: [
        'http://localhost:5173'
    ]
}))

export default app;