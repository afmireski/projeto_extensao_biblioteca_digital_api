import { Kysely, sql, type SqlBool } from 'kysely';
import type { DB } from '../../infra/database/types';
import type { IUserRepository } from './users.repository.port';
import type { ActiveUser } from './users.types';

export class UserRepository implements IUserRepository {
  constructor(private readonly db: Kysely<DB>) {}

  public findActiveById(id: string): Promise<ActiveUser | null> {
    return this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
      .then((user) => user ?? null);
  }

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

  public emailExists(email: string): Promise<boolean> {
    return this.db
      .selectFrom('users')
      .select('id')
      .where('email', '=', email)
      .executeTakeFirst()
      .then((user) => !!user);
  }

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

  public updatePasswordHash(id: string, newHash: string): Promise<void> {
    return this.db
      .updateTable('users')
      .set({ password_hash: newHash })
      .where('id', '=', id)
      .execute()
      .then(() => {});
  }

  public softDelete(id: string): Promise<void> {
    return this.db
      .updateTable('users')
      .set({ deleted_at: sql`now()` })
      .where('id', '=', id)
      .execute()
      .then(() => {});
  }

  public revokeAllSessions(userId: string): Promise<void> {
    return this.db
      .deleteFrom('sessions')
      .where('user_id', '=', userId)
      .execute()
      .then(() => {});
  }

  public revokeSession(sessionId: string): Promise<void> {
    return this.db
      .deleteFrom('sessions')
      .where('id', '=', sessionId)
      .execute()
      .then(() => {});
  }
}
