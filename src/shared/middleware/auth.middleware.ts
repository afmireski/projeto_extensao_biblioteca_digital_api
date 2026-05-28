import type { RequestHandler } from 'express';
import type { IJwtService } from '../services/jwt.service.port';
import type { IUserRepository } from '../../modules/users/users.repository.port';
import { UnauthorizedError } from '../errors/app-errors';

/**
 * Factory function to create the Express authentication middleware.
 * Verifies the Bearer JWT token from the Authorization header and fetches the associated active user profile.
 * @param jwtService - Service for decoding and verifying JWT tokens.
 * @param userRepository - Repository for verifying active user session credentials.
 * @returns Express RequestHandler middleware function.
 */
export const makeAuthMiddleware = (
  jwtService: IJwtService,
  userRepository: IUserRepository,
): RequestHandler => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Missing or invalid token'));
    }

    const token = authHeader.slice(7);

    jwtService
      .verify(token)
      .then((payload) => {
        return Promise.all([
          payload,
          userRepository.findActiveUserBySessionId(payload.sessionId),
        ]);
      })
      .then(([payload, user]) => {
        if (!user) {
          throw new UnauthorizedError('Session expired or revoked');
        }

        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionId: payload.sessionId,
        };
        next();
      })
      .catch((err) => next(err));
  };
};
