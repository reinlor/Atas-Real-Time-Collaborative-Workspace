import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

// valid envs
const validEnv = {
  NODE_ENV: 'test',
  PORT: '4000',
  ORIGIN_URI: 'https://example.com/some/path/',
  LOG_LEVEL: 'info',
  JWT_SECRET: 'a'.repeat(32),
  JWT_FORGOT_PASS_SECRET: 'b'.repeat(32),
  JWT_VERIFICATION_SECRET: 'c'.repeat(32),
  MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/mydb',
  REDIS_URL: 'rediss://default:secret@redis.example.com:6379/0',
  GOOGLE_CLIENT_ID: '1234567890-abcdef123456.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'GOCSPX-validsecret123',
  EMAIL_USER: 'noreply@example.com',
  EMAIL_PASS: 'supersecretpass',
  GEMINI_API_KEY: 'AIzaSyValidApiKey123',
  GEMINI_MODEL: 'gemini-2.5-pro',
};

jest.unstable_mockModule('dotenv', () => ({
  config: jest.fn(),
}));

describe('Environment Configuration (env.ts)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, ...validEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('parseEnv()', () => {
    it('parses and normalizes a complete valid environment', async () => {
      const { parseEnv } = await import('../../src/config/env.js');
      const result = parseEnv(validEnv);

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data).toEqual({
        ...validEnv,
        PORT: 4000,
        ORIGIN_URI: 'https://example.com',
      });
    });

    it('applies default values when optional fields are omitted or empty strings', async () => {
      const { parseEnv } = await import('../../src/config/env.js');

      const {
        NODE_ENV: _n,
        PORT: _p,
        ORIGIN_URI: _o,
        LOG_LEVEL: _l,
        GEMINI_MODEL: _g,
        ...requiredOnly
      } = validEnv;

      const result = parseEnv({
        ...requiredOnly,
        PORT: '   ', 
        ORIGIN_URI: '',
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.NODE_ENV).toBe('production');
      expect(result.data.PORT).toBe(3000);
      expect(result.data.ORIGIN_URI).toBe('http://localhost:3000');
      expect(result.data.LOG_LEVEL).toBe('debug');
      expect(result.data.GEMINI_MODEL).toBe('gemini-2.5-flash');
    });

    describe('Server & Origin validation', () => {
      it('rejects invalid NODE_ENV and LOG_LEVEL enum values', async () => {
        const { parseEnv } = await import('../../src/config/env.js');
        const result = parseEnv({
          ...validEnv,
          NODE_ENV: 'staging',
          LOG_LEVEL: 'verbose',
        });

        expect(result.success).toBe(false);
        if (result.success) return;

        const fields = result.error.issues.map((i) => i.path[0]);
        expect(fields).toContain('NODE_ENV');
        expect(fields).toContain('LOG_LEVEL');
      });

      it('rejects out-of-range or non-integer PORT values', async () => {
        const { parseEnv } = await import('../../src/config/env.js');

        expect(parseEnv({ ...validEnv, PORT: '0' }).success).toBe(false);
        expect(parseEnv({ ...validEnv, PORT: '65536' }).success).toBe(false);
        expect(parseEnv({ ...validEnv, PORT: '3000.5' }).success).toBe(false);
        expect(parseEnv({ ...validEnv, PORT: 'abc' }).success).toBe(false);
      });

      it('rejects non-http(s) ORIGIN_URI protocols (e.g. ftp:// or wildcard *)', async () => {
        const { parseEnv } = await import('../../src/config/env.js');

        expect(parseEnv({ ...validEnv, ORIGIN_URI: 'ftp://example.com' }).success).toBe(false);
        expect(parseEnv({ ...validEnv, ORIGIN_URI: '*' }).success).toBe(false);
      });
    });

    describe('JWT secrets validation', () => {
      it('rejects JWT secrets shorter than 32 characters', async () => {
        const { parseEnv } = await import('../../src/config/env.js');
        const result = parseEnv({
          ...validEnv,
          JWT_SECRET: 'short',
          JWT_FORGOT_PASS_SECRET: 'short',
          JWT_VERIFICATION_SECRET: 'short',
        });

        expect(result.success).toBe(false);
        if (result.success) return;

        const fields = result.error.issues.map((i) => i.path[0]);
        expect(fields).toEqual(
          expect.arrayContaining(['JWT_SECRET', 'JWT_FORGOT_PASS_SECRET', 'JWT_VERIFICATION_SECRET']),
        );
      });
    });

    describe('Database, Redis, Google, Email, and Gemini validation', () => {
      it('accepts standard mongodb:// and redis:// URLs', async () => {
        const { parseEnv } = await import('../../src/config/env.js');
        const result = parseEnv({
          ...validEnv,
          MONGODB_URI: 'mongodb://localhost:27017/testdb',
          REDIS_URL: 'redis://127.0.0.1:6379',
        });

        expect(result.success).toBe(true);
      });

      it('rejects malformed MONGODB_URI and REDIS_URL', async () => {
        const { parseEnv } = await import('../../src/config/env.js');
        const result = parseEnv({
          ...validEnv,
          MONGODB_URI: 'postgres://localhost:5432/db',
          REDIS_URL: 'http://localhost:6379',
        });

        expect(result.success).toBe(false);
        if (result.success) return;

        const fields = result.error.issues.map((i) => i.path[0]);
        expect(fields).toContain('MONGODB_URI');
        expect(fields).toContain('REDIS_URL');
      });

      it('rejects invalid GOOGLE_CLIENT_ID format and invalid EMAIL_USER', async () => {
        const { parseEnv } = await import('../../src/config/env.js');
        const result = parseEnv({
          ...validEnv,
          GOOGLE_CLIENT_ID: 'invalid-client-id',
          EMAIL_USER: 'not-an-email',
        });

        expect(result.success).toBe(false);
        if (result.success) return;

        const fields = result.error.issues.map((i) => i.path[0]);
        expect(fields).toContain('GOOGLE_CLIENT_ID');
        expect(fields).toContain('EMAIL_USER');
      });

      it('fails when required variables are missing', async () => {
        const { parseEnv } = await import('../../src/config/env.js');
        const result = parseEnv({});

        expect(result.success).toBe(false);
        if (result.success) return;

        const missingFields = result.error.issues.map((i) => i.path[0]);
        expect(missingFields).toEqual(
          expect.arrayContaining([
            'JWT_SECRET',
            'JWT_FORGOT_PASS_SECRET',
            'JWT_VERIFICATION_SECRET',
            'MONGODB_URI',
            'REDIS_URL',
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET',
            'EMAIL_USER',
            'EMAIL_PASS',
            'GEMINI_API_KEY',
          ]),
        );
      });
    });
  });

  describe('Module initialization (loadEnv / env)', () => {
    it('exports a frozen env object when process.env is valid', async () => {
      const { env } = await import('../../src/config/env.js');

      expect(Object.isFrozen(env)).toBe(true);
      expect(env.PORT).toBe(4000);
      expect(env.ORIGIN_URI).toBe('https://example.com');
    });

    it('logs prettified errors and calls process.exit(1) when process.env is invalid', async () => {
      process.env = { ...originalEnv };

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit(${code})`);
      });

      await expect(import('../../src/config/env.js')).rejects.toThrow('process.exit(1)');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid environment variables:'),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });
});