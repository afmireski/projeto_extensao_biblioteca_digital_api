import { expect, test, describe, mock, beforeEach } from 'bun:test';
import { AuthService } from '../../../../src/modules/auth/auth.service';
import type { IAuthRepository } from '../../../../src/modules/auth/auth.repository.port';
import type { IJwtService } from '../../../../src/shared/services/jwt.service.port';
import { UnauthorizedError } from '../../../../src/shared/errors/app-errors';
import type { LoginInput } from '../../../../src/modules/auth/auth.types';

const expectError = (
  promise: Promise<unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorClass: new (...args: any[]) => any,
  code: string,
): Promise<void> => {
  return promise.then(
    () => {
      throw new Error('Expected promise to be rejected');
    },
    (err) => {
      expect(err).toBeInstanceOf(errorClass);
      expect((err as { code?: string }).code).toBe(code);
    },
  );
};

describe('AuthService', () => {
  let authRepositoryMock: IAuthRepository & {
    findActiveUserByEmail: ReturnType<typeof mock>;
    createSession: ReturnType<typeof mock>;
  };
  let jwtServiceMock: IJwtService & {
    sign: ReturnType<typeof mock>;
  };
  let service: AuthService;

  beforeEach(() => {
    authRepositoryMock = {
      findActiveUserByEmail: mock(),
      createSession: mock(),
    } as unknown as IAuthRepository & {
      findActiveUserByEmail: ReturnType<typeof mock>;
      createSession: ReturnType<typeof mock>;
    };

    jwtServiceMock = {
      sign: mock(),
      verify: mock(),
    } as unknown as IJwtService & {
      sign: ReturnType<typeof mock>;
    };

    service = new AuthService(authRepositoryMock, jwtServiceMock);
  });

  describe('login', () => {
    test('should authenticate user successfully and return login output', async () => {
      const input: LoginInput = {
        email: 'user@example.com',
        password: 'password123',
      };

      const passwordHash = await Bun.password.hash('password123');
      const fakeUser = {
        id: 'user-uuid',
        name: 'John Doe',
        email: 'user@example.com',
        password_hash: passwordHash,
        role: 'manager' as const,
      };

      authRepositoryMock.findActiveUserByEmail.mockResolvedValue(fakeUser);
      authRepositoryMock.createSession.mockResolvedValue('session-uuid');
      jwtServiceMock.sign.mockResolvedValue('fake-jwt-token');

      const result = await service.login(input);

      expect(authRepositoryMock.findActiveUserByEmail).toHaveBeenCalledWith(
        input.email,
      );
      expect(authRepositoryMock.createSession).toHaveBeenCalledWith(
        'user-uuid',
        expect.any(Date),
      );
      expect(jwtServiceMock.sign).toHaveBeenCalledWith({
        sessionId: 'session-uuid',
        role: 'manager',
      });
      expect(result).toEqual({
        token: 'fake-jwt-token',
        email: 'user@example.com',
        name: 'John Doe',
      });
    });

    test('should throw UnauthorizedError if email is not found', () => {
      const input: LoginInput = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      authRepositoryMock.findActiveUserByEmail.mockResolvedValue(undefined);

      return expectError(
        service.login(input),
        UnauthorizedError,
        'auth.invalid_credentials',
      ).then(() => {
        expect(authRepositoryMock.createSession).not.toHaveBeenCalled();
        expect(jwtServiceMock.sign).not.toHaveBeenCalled();
      });
    });

    test('should throw UnauthorizedError if password is incorrect', async () => {
      const input: LoginInput = {
        email: 'user@example.com',
        password: 'wrongpassword',
      };

      const passwordHash = await Bun.password.hash('password123');
      const fakeUser = {
        id: 'user-uuid',
        name: 'John Doe',
        email: 'user@example.com',
        password_hash: passwordHash,
        role: 'manager' as const,
      };

      authRepositoryMock.findActiveUserByEmail.mockResolvedValue(fakeUser);

      return expectError(
        service.login(input),
        UnauthorizedError,
        'auth.invalid_credentials',
      ).then(() => {
        expect(authRepositoryMock.createSession).not.toHaveBeenCalled();
        expect(jwtServiceMock.sign).not.toHaveBeenCalled();
      });
    });
  });
});
