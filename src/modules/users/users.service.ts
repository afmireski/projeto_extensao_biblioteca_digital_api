import type { IUserRepository } from './users.repository.port';
import type {
  SignupInput,
  SignupOutput,
  ProfileOutput,
  UpdateProfileInput,
  UpdatePasswordInput,
} from './users.types';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  UnauthorizedError,
} from '../../shared/errors/app-errors';
import { logger } from '../../shared/logger';

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Registers a new user with role 'reader'.
   * Throws ConflictError if email already exists.
   * Returns the registered email on success.
   */
  public signup(input: SignupInput): Promise<SignupOutput> {
    return this.userRepository.emailExists(input.email).then((exists) => {
      if (exists) {
        throw new ConflictError('user.email_conflict', 'Email already in use');
      }
      return Bun.password
        .hash(input.password)
        .then((hash) =>
          this.userRepository.createReader(input.name, input.email, hash),
        )
        .then((email) => {
          logger.info({ email }, 'New user registered');
          return { email };
        });
    });
  }

  /**
   * Returns public profile data for a given user id.
   * Throws NotFoundError if the user does not exist or is soft-deleted.
   */
  public getProfile(userId: string): Promise<ProfileOutput> {
    return this.userRepository.findActiveById(userId).then((user) => {
      if (!user) {
        throw new NotFoundError('user');
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
      };
    });
  }

  /**
   * Updates the name and/or email of a user.
   * If the new email already belongs to another user, silently succeeds
   * without applying the change (masked conflict, anti-enumeration).
   */
  public updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<void> {
    const p = input.email
      ? this.userRepository.emailExistsForOtherUser(input.email, userId)
      : Promise.resolve(false);

    return p.then((conflict) => {
      if (conflict) {
        logger.info(
          { userId, email: input.email },
          'Profile update email conflict masked',
        );
        return Promise.resolve(); // Masked success
      }
      return this.userRepository.updateProfile(userId, input);
    });
  }

  /**
   * Changes the user's password after verifying the old password.
   * Revokes all active sessions on success, forcing re-authentication.
   * Throws UnauthorizedError if old password does not match.
   * Throws ValidationError if new password and confirmPassword differ.
   */
  public updatePassword(
    userId: string,
    input: UpdatePasswordInput,
  ): Promise<void> {
    if (input.password !== input.confirmPassword) {
      return Promise.reject(new ValidationError('Passwords do not match'));
    }

    return this.userRepository.findActiveById(userId).then((user) => {
      if (!user) throw new NotFoundError('user');

      return Bun.password
        .verify(input.oldPassword, user.password_hash)
        .then((isValid) => {
          if (!isValid) throw new UnauthorizedError('Invalid old password');
          return Bun.password.hash(input.password);
        })
        .then((newHash) =>
          this.userRepository.updatePasswordHash(userId, newHash),
        )
        .then(() => this.userRepository.revokeAllSessions(userId))
        .then(() => {
          logger.info({ userId }, 'Password updated and sessions revoked');
        });
    });
  }

  /**
   * Soft-deletes the authenticated user's account and revokes all sessions.
   */
  public deleteAccount(userId: string): Promise<void> {
    return this.userRepository
      .softDelete(userId)
      .then(() => this.userRepository.revokeAllSessions(userId))
      .then(() => {
        logger.info({ userId }, 'User account soft-deleted');
      });
  }

  /**
   * Revokes the current session, effectively signing the user out.
   */
  public signout(sessionId: string): Promise<void> {
    return this.userRepository.revokeSession(sessionId).then(() => {
      logger.info({ sessionId }, 'Session revoked (signout)');
    });
  }
}
