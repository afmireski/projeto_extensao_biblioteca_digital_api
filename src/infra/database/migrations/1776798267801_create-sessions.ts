import type { Kysely, Migration } from 'kysely';
import { sql } from 'kysely';

export const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable('sessions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('sessions_user_id_idx')
    .on('sessions')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('sessions_expires_at_idx')
    .on('sessions')
    .column('expires_at')
    .execute();
};

export const down = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.dropTable('sessions').ifExists().execute();
};

export default { up, down } satisfies Migration;
