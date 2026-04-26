import type { IAuthRepository } from './auth.repository.port';
import type { IJwtService } from '../../shared/services/jwt.service.port';
import type { LoginInput, LoginOutput } from './auth.types';
import { UnauthorizedError } from '../../shared/errors/app-errors';
import { addDays } from 'date-fns';
import { logger } from '../../shared/logger';

export class AuthService {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly jwtService: IJwtService,
  ) {}

  /**
   * Authenticates a user by email and password.
   * Creates a new session in the database and returns a signed JWT
   * containing the session id and user role.
   * Throws UnauthorizedError if credentials are invalid.
   */
  public login(input: LoginInput): Promise<LoginOutput> {
    return this.authRepository
      .findActiveUserByEmail(input.email)
      .then((user) => {
        if (!user) {
          throw new UnauthorizedError('Invalid email or password');
        }
        return Promise.all([
          user,
          Bun.password.verify(input.password, user.password_hash),
        ]);
      })
      .then(([user, isPasswordValid]) => {
        if (!isPasswordValid) {
          throw new UnauthorizedError('Invalid email or password');
        }

        const expiryDays = process.env.JWT_EXPIRY_DAYS
          ? parseInt(process.env.JWT_EXPIRY_DAYS, 10)
          : 7;
        const expiresAt = addDays(new Date(), expiryDays);

        return Promise.all([
          user,
          this.authRepository.createSession(user.id, expiresAt),
        ]);
      })
      .then(([user, sessionId]) => {
        return Promise.all([
          user,
          this.jwtService.sign({ sessionId, role: user.role }),
        ]);
      })
      .then(([user, token]) => {
        logger.info({ userId: user.id }, 'User logged in successfully');
        return {
          token,
          email: user.email,
          name: user.name,
        };
      });
  }
}
