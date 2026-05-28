import { Kysely } from 'kysely';
import type { DB } from '../../infra/database/types';
import type { IAuthRepository } from './auth.repository.port';
import type { ActiveUser } from './auth.types';

/**
 * Database implementation of the authentication repository port using Kysely.
 * Interacts with 'users' and 'sessions' tables to manage auth data.
 */
export class AuthRepository implements IAuthRepository {
  constructor(private readonly db: Kysely<DB>) {}

  /**
   * Retrieves an active user by their email address.
   * Excludes users that have been soft-deleted.
   * @param email - The email address to look up.
   * @returns A promise resolving to the user if found, or null.
   */
  public findActiveUserByEmail(email: string): Promise<ActiveUser | null> {
    return this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
      .then((user) => user ?? null);
  }

  /**
   * Creates a new user session with a given expiration date.
   * @param userId - The UUID of the user.
   * @param expiresAt - The session expiration timestamp.
   * @returns A promise resolving to the generated session ID.
   */
  public createSession(userId: string, expiresAt: Date): Promise<string> {
    return this.db
      .insertInto('sessions')
      .values({
        user_id: userId,
        expires_at: expiresAt,
      })
      .returning('id')
      .executeTakeFirstOrThrow()
      .then((row) => row.id);
  }
}
