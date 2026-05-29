import { expect, test, describe } from 'bun:test';
import express from 'express';
import { corsMiddleware } from '../../../../src/shared/middleware/cors.middleware';

describe('corsMiddleware', () => {
  const runTestServer = async (
    setupMiddleware: () => express.RequestHandler,
    originToTest: string | undefined,
    method: string = 'GET',
  ) => {
    const app = express();
    app.use(setupMiddleware());
    app.get('/test', (req, res) => {
      res.json({ ok: true });
    });

    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === 'string' ? address : address?.port;
    const url = `http://localhost:${port}/test`;

    const headers: Record<string, string> = {};
    if (originToTest) {
      headers['Origin'] = originToTest;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
      });
      await response.json();
      return {
        allowOriginHeader: response.headers.get('access-control-allow-origin'),
        credentialsHeader: response.headers.get(
          'access-control-allow-credentials',
        ),
      };
    } finally {
      server.close();
    }
  };

  test('should allow request with no origin (like mobile apps, curl)', async () => {
    const res = await runTestServer(corsMiddleware, undefined);
    expect(res.allowOriginHeader).toBeNull();
  });

  test('should allow default origins when CORS_ORIGIN is not configured', async () => {
    const originalEnv = process.env.CORS_ORIGIN;
    delete process.env.CORS_ORIGIN;

    try {
      const res = await runTestServer(corsMiddleware, 'http://localhost:3000');
      expect(res.allowOriginHeader).toBe('http://localhost:3000');
      expect(res.credentialsHeader).toBe('true');
    } finally {
      process.env.CORS_ORIGIN = originalEnv;
    }
  });

  test('should reject unknown origins in test environment when CORS_ORIGIN is not configured', async () => {
    const originalEnv = process.env.CORS_ORIGIN;
    const originalNodeEnv = process.env.NODE_ENV;
    delete process.env.CORS_ORIGIN;
    process.env.NODE_ENV = 'test';

    try {
      const res = await runTestServer(corsMiddleware, 'http://localhost:4000');
      expect(res.allowOriginHeader).toBeNull();
    } finally {
      process.env.CORS_ORIGIN = originalEnv;
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  test('should allow any localhost origin when NODE_ENV is development', async () => {
    const originalEnv = process.env.CORS_ORIGIN;
    const originalNodeEnv = process.env.NODE_ENV;
    delete process.env.CORS_ORIGIN;
    process.env.NODE_ENV = 'development';

    try {
      const res = await runTestServer(corsMiddleware, 'http://localhost:4000');
      expect(res.allowOriginHeader).toBe('http://localhost:4000');
    } finally {
      process.env.CORS_ORIGIN = originalEnv;
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  test('should allow specific origin configured in CORS_ORIGIN env var', async () => {
    const originalEnv = process.env.CORS_ORIGIN;
    process.env.CORS_ORIGIN = 'https://myfrontend.com,https://another.com';

    try {
      const res1 = await runTestServer(
        corsMiddleware,
        'https://myfrontend.com',
      );
      expect(res1.allowOriginHeader).toBe('https://myfrontend.com');

      const res2 = await runTestServer(corsMiddleware, 'https://another.com');
      expect(res2.allowOriginHeader).toBe('https://another.com');

      const res3 = await runTestServer(corsMiddleware, 'https://blocked.com');
      expect(res3.allowOriginHeader).toBeNull();
    } finally {
      process.env.CORS_ORIGIN = originalEnv;
    }
  });

  test('should allow any origin if CORS_ORIGIN is asterisk', async () => {
    const originalEnv = process.env.CORS_ORIGIN;
    process.env.CORS_ORIGIN = '*';

    try {
      const res = await runTestServer(corsMiddleware, 'https://anydomain.com');
      expect(res.allowOriginHeader).toBe('https://anydomain.com');
      expect(res.credentialsHeader).toBe('true');
    } finally {
      process.env.CORS_ORIGIN = originalEnv;
    }
  });
});
