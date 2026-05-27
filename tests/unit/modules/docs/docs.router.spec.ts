import { expect, test, describe, mock, beforeEach, afterEach } from 'bun:test';
import type { Request, Response } from 'express';
import { makeDocsRouter } from '../../../../src/modules/docs/docs.router';

interface DocsHandlerLayer {
  route: {
    path: string;
    stack: Array<{
      handle: (req: Request, res: Response, next: () => void) => void;
    }>;
  };
}

interface RouterStack {
  stack: Array<{
    route?: {
      path: string;
      stack: Array<{
        handle: (req: Request, res: Response, next: () => void) => void;
      }>;
    };
  }>;
}

describe('DocsRouter', () => {
  let router: unknown;
  const originalSwaggerToken = process.env.SWAGGER_TOKEN;

  beforeEach(() => {
    process.env.SWAGGER_TOKEN = 'secret-test-token';
    router = makeDocsRouter();
  });

  afterEach(() => {
    process.env.SWAGGER_TOKEN = originalSwaggerToken;
  });

  describe('GET /', () => {
    test('renders gate page with form when SWAGGER_TOKEN is configured', () => {
      const handlers = (router as RouterStack).stack.filter(
        (layer) => layer.route && layer.route.path === '/',
      ) as DocsHandlerLayer[];
      expect(handlers.length).toBe(1);

      const handler = handlers[0]!.route.stack[0]!.handle;

      const req = {} as Request;
      const res = {
        send: mock(),
        setHeader: mock(),
      } as unknown as Response;

      handler(req, res, () => {});

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/html; charset=utf-8',
      );
      expect(res.send).toHaveBeenCalled();
      const sendCalls = (res.send as ReturnType<typeof mock>).mock.calls;
      const htmlOutput = sendCalls[0]![0] as string;
      expect(htmlOutput).toContain('gate-form');
      expect(htmlOutput).toContain('Acesso Restrito');
    });

    test('renders gate page with direct link when SWAGGER_TOKEN is not configured', () => {
      process.env.SWAGGER_TOKEN = '';
      const noTokenRouter = makeDocsRouter();
      const handlers = (noTokenRouter as RouterStack).stack.filter(
        (layer) => layer.route && layer.route.path === '/',
      ) as DocsHandlerLayer[];
      const handler = handlers[0]!.route.stack[0]!.handle;

      const req = {} as Request;
      const res = {
        send: mock(),
        setHeader: mock(),
      } as unknown as Response;

      handler(req, res, () => {});

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/html; charset=utf-8',
      );
      expect(res.send).toHaveBeenCalled();
      const sendCalls = (res.send as ReturnType<typeof mock>).mock.calls;
      const htmlOutput = sendCalls[0]![0] as string;
      expect(htmlOutput).toContain('open-link');
      expect(htmlOutput).toContain('Abrir Swagger UI');
    });
  });

  describe('GET /ui (authentication middleware)', () => {
    test('allows access (calls next) when valid token is provided in headers', () => {
      const handlers = (router as RouterStack).stack.filter(
        (layer) => layer.route && layer.route.path === '/ui',
      ) as DocsHandlerLayer[];
      expect(handlers.length).toBe(1);

      const authMiddleware = handlers[0]!.route.stack[0]!.handle;

      const req = {
        headers: {
          'x-docs-token': 'secret-test-token',
        },
        query: {},
      } as unknown as Request;

      const res = {
        status: mock(() => res),
        redirect: mock(),
      } as unknown as Response;

      const next = mock();

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    test('allows access (calls next) when valid token is provided in query params', () => {
      const handlers = (router as RouterStack).stack.filter(
        (layer) => layer.route && layer.route.path === '/ui',
      ) as DocsHandlerLayer[];
      const authMiddleware = handlers[0]!.route.stack[0]!.handle;

      const req = {
        headers: {},
        query: {
          t: 'secret-test-token',
        },
      } as unknown as Request;

      const res = {
        status: mock(() => res),
        redirect: mock(),
      } as unknown as Response;

      const next = mock();

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });

    test('redirects to /docs with 401 when token is missing or invalid', () => {
      const handlers = (router as RouterStack).stack.filter(
        (layer) => layer.route && layer.route.path === '/ui',
      ) as DocsHandlerLayer[];
      const authMiddleware = handlers[0]!.route.stack[0]!.handle;

      const req = {
        headers: {
          'x-docs-token': 'wrong-token',
        },
        query: {},
      } as unknown as Request;

      const res = {
        status: mock(() => res),
        redirect: mock(),
      } as unknown as Response;

      const next = mock();

      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.redirect).toHaveBeenCalledWith('/docs');
    });

    test('allows access directly when SWAGGER_TOKEN is not configured', () => {
      process.env.SWAGGER_TOKEN = '';
      const noTokenRouter = makeDocsRouter();
      const handlers = (noTokenRouter as RouterStack).stack.filter(
        (layer) => layer.route && layer.route.path === '/ui',
      ) as DocsHandlerLayer[];
      const authMiddleware = handlers[0]!.route.stack[0]!.handle;

      const req = {
        headers: {},
        query: {},
      } as unknown as Request;

      const res = {
        status: mock(() => res),
        redirect: mock(),
      } as unknown as Response;

      const next = mock();

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.redirect).not.toHaveBeenCalled();
    });
  });
});
