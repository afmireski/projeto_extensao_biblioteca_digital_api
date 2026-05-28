import { Kysely, sql, type SqlBool } from 'kysely';
import type { DB } from '../../infra/database/types';
import type { IUserRepository } from './users.repository.port';
import type { ActiveUser } from './users.types';

/**
 * Kysely-based database implementation of the user repository port.
 * Performs database queries on the 'users' and 'sessions' tables.
 */
export class UserRepository implements IUserRepository {
  constructor(private readonly db: Kysely<DB>) {}

  /**
   * Retrieves a non-deleted user by their ID.
   * @param id - The UUID of the user.
   * @returns A promise resolving to the user if active, or null.
   */
  public findActiveById(id: string): Promise<ActiveUser | null> {
    return this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
      .then((user) => user ?? null);
  }

  /**
   * Retrieves an active user associated with a given unexpired session ID.
   * @param sessionId - The session ID string.
   * @returns A promise resolving to the user if the session is valid, or null.
   */
  public findActiveUserBySessionId(
    sessionId: string,
  ): Promise<ActiveUser | null> {
    return this.db
      .selectFrom('sessions')
      .innerJoin('users', 'users.id', 'sessions.user_id')
      .selectAll('users')
      .where('sessions.id', '=', sessionId)
      .where(sql<SqlBool>`sessions.expires_at > now()`)
      .where('users.deleted_at', 'is', null)
      .executeTakeFirst()
      .then((user) => user ?? null);
  }

  /**
   * Checks if a user with the specified email address exists in the database.
   * @param email - The email address to check.
   * @returns A promise resolving to true if any user exists, false otherwise.
   */
  public emailExists(email: string): Promise<boolean> {
    return this.db
      .selectFrom('users')
      .select('id')
      .where('email', '=', email)
      .executeTakeFirst()
      .then((user) => !!user);
  }

  /**
   * Checks if an email is registered to a different user than the excluded one.
   * @param email - The email address to check.
   * @param excludeUserId - The user ID to exclude from search.
   * @returns A promise resolving to true if another user has the email.
   */
  public emailExistsForOtherUser(
    email: string,
    excludeUserId: string,
  ): Promise<boolean> {
    return this.db
      .selectFrom('users')
      .select('id')
      .where('email', '=', email)
      .where('id', '!=', excludeUserId)
      .executeTakeFirst()
      .then((user) => !!user);
  }

  /**
   * Inserts a new user with the reader role and returns their email.
   * @param name - The name of the user.
   * @param email - The email address.
   * @param passwordHash - The hashed password string.
   * @returns A promise resolving to the created user's email.
   */
  public createReader(
    name: string,
    email: string,
    passwordHash: string,
  ): Promise<string> {
    return this.db
      .insertInto('users')
      .values({
        name,
        email,
        password_hash: passwordHash,
        role: 'reader',
      })
      .returning('email')
      .executeTakeFirstOrThrow()
      .then((row) => row.email);
  }

  /**
   * Updates user profile fields (name and/or email) by user ID.
   * @param id - The user UUID.
   * @param data - The optional name and email updates.
   */
  public updateProfile(
    id: string,
    data: { name?: string; email?: string },
  ): Promise<void> {
    if (Object.keys(data).length === 0) return Promise.resolve();
    return this.db
      .updateTable('users')
      .set(data)
      .where('id', '=', id)
      .execute()
      .then(() => {});
  }

  /**
   * Updates the user's password hash in the database.
   * @param id - The user UUID.
   * @param newHash - The new password hash.
   */
  public updatePasswordHash(id: string, newHash: string): Promise<void> {
    return this.db
      .updateTable('users')
      .set({ password_hash: newHash })
      .where('id', '=', id)
      .execute()
      .then(() => {});
  }

  /**
   * Soft-deletes a user by setting their deleted_at timestamp.
   * @param id - The user UUID.
   */
  public softDelete(id: string): Promise<void> {
    return this.db
      .updateTable('users')
      .set({ deleted_at: sql`now()` })
      .where('id', '=', id)
      .execute()
      .then(() => {});
  }

  /**
   * Revokes all active sessions for a user ID.
   * @param userId - The user UUID.
   */
  public revokeAllSessions(userId: string): Promise<void> {
    return this.db
      .deleteFrom('sessions')
      .where('user_id', '=', userId)
      .execute()
      .then(() => {});
  }

  /**
   * Revokes a single session by its session ID.
   * @param sessionId - The session ID.
   */
  public revokeSession(sessionId: string): Promise<void> {
    return this.db
      .deleteFrom('sessions')
      .where('id', '=', sessionId)
      .execute()
      .then(() => {});
  }
}
