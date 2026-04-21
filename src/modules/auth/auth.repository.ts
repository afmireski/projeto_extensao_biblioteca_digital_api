import { Kysely } from 'kysely';
import type { DB } from '../../infra/database/types';
import type { IAuthRepository } from './auth.repository.port';
import type { ActiveUser } from './auth.types';

export class AuthRepository implements IAuthRepository {
  constructor(private readonly db: Kysely<DB>) {}

  public findActiveUserByEmail(email: string): Promise<ActiveUser | null> {
    return this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
      .then((user) => user ?? null);
  }

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
