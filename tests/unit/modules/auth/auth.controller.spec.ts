import { expect, test, describe, mock, beforeEach } from 'bun:test';
import type { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../../src/modules/auth/auth.service';

describe('AuthController', () => {
  let authServiceMock: AuthService;
  let controller: AuthController;

  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    authServiceMock = {
      login: mock(),
    } as unknown as AuthService;

    controller = new AuthController(authServiceMock);

    req = {
      body: {
        email: 'user@example.com',
        password: 'password123',
      },
    };

    res = {
      status: mock(() => res),
      json: mock(),
    } as unknown as Partial<Response>;

    next = mock() as unknown as NextFunction;
  });

  describe('login', () => {
    test('should return 200 and auth token on success', async () => {
      const loginOutput = {
        token: 'signed-jwt-token',
        email: 'user@example.com',
        name: 'John Doe',
      };
      const loginPromise = Promise.resolve(loginOutput);

      (authServiceMock.login as ReturnType<typeof mock>).mockReturnValue(
        loginPromise,
      );

      controller.login(req as Request, res as Response, next);

      await loginPromise;

      expect(authServiceMock.login).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(loginOutput);
      expect(next).not.toHaveBeenCalled();
    });

    test('should call next with error on login failure', async () => {
      const error = new Error('Auth failed');
      const loginPromise = Promise.reject(error);

      (authServiceMock.login as ReturnType<typeof mock>).mockReturnValue(
        loginPromise,
      );

      controller.login(req as Request, res as Response, next);

      await loginPromise.catch(() => {});

      expect(authServiceMock.login).toHaveBeenCalledWith(req.body);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
