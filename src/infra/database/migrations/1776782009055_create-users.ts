import type { Kysely, Migration } from 'kysely';
import { sql } from 'kysely';

export const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createType('user_role')
    .asEnum(['reader', 'manager'])
    .execute();

  await sql`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `.execute(db);

  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
    .addColumn('email', 'varchar(255)', (col) => col.unique().notNull())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('password_hash', 'text', (col) => col.notNull())
    .addColumn('role', sql`user_role`, (col) =>
      col.notNull().defaultTo('reader'),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute();

  await sql`
    CREATE TRIGGER set_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `.execute(db);
};

export const down = async (db: Kysely<unknown>): Promise<void> => {
  await sql`DROP TRIGGER IF EXISTS set_users_updated_at ON users;`.execute(db);
  await db.schema.dropTable('users').ifExists().execute();
  await sql`DROP FUNCTION IF EXISTS set_updated_at();`.execute(db);
  await db.schema.dropType('user_role').ifExists().execute();
};

export default { up, down } satisfies Migration;
