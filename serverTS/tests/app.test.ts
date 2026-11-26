import { describe, expect, it } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import app from '../src/app.js';
import { env } from '../src/config/env.js';

const testApp = express();
testApp.use(app);
testApp.get('/__test-ok', (_req, res) => {
  res.status(200).json({ ok: true });
});

describe('Express App Security & Middleware (app.ts)', () => {
  describe('Helmet security headers', () => {
    it('sets strict CSP and security headers while hiding X-Powered-By', async () => {
      const res = await request(testApp).get('/__test-ok');

      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['referrer-policy']).toBe('no-referrer');
      expect(res.headers['cross-origin-resource-policy']).toBe('same-origin');
      expect(res.headers['content-security-policy']).toContain("default-src 'none'");
      expect(res.headers['content-security-policy']).toContain("base-uri 'none'");
      expect(res.headers['content-security-policy']).toContain("form-action 'none'");
      expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    });

    it('disables HSTS outside of production', async () => {
      const res = await request(testApp).get('/__test-ok');

      expect(res.headers['strict-transport-security']).toBeUndefined();
    });
  });

  describe('CORS policy', () => {
    it('allows requests and credentials from the configured ORIGIN_URI', async () => {
      const res = await request(testApp)
        .get('/__test-ok')
        .set('Origin', env.ORIGIN_URI);

      expect(res.headers['access-control-allow-origin']).toBe(env.ORIGIN_URI);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('never reflects unauthorized origins in Access-Control-Allow-Origin', async () => {
      const res = await request(testApp)
        .get('/__test-ok')
        .set('Origin', 'https://unauthorized-attacker.com');

      expect(res.headers['access-control-allow-origin']).not.toBe('https://unauthorized-attacker.com');
      expect(res.headers['access-control-allow-origin']).toBe(env.ORIGIN_URI);
    });

    it('responds with 204 to preflight OPTIONS requests', async () => {
      const res = await request(testApp)
        .options('/__test-ok')
        .set('Origin', env.ORIGIN_URI)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(env.ORIGIN_URI);
      expect(res.headers['access-control-allow-methods']).toContain('POST');
      expect(res.headers['access-control-allow-headers']).toContain('Authorization');
    });
  });
});