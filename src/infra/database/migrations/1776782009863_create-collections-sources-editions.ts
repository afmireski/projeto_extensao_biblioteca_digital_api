import type { Kysely, Migration } from 'kysely'
import { sql } from 'kysely'

export const up = async (db: Kysely<unknown>): Promise<void> => {
  // collections
  await db.schema
    .createTable('collections')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'varchar(5000)')
    .addColumn('institution', 'varchar(255)')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('deleted_at', 'timestamptz')
    .execute()

  await sql`
    CREATE TRIGGER set_collections_updated_at
      BEFORE UPDATE ON collections
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `.execute(db)

  await db.schema.createIndex('idx_collections_name').on('collections').column('name').execute()

  // sources
  await db.schema
    .createTable('sources')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
    .addColumn('collection_id', 'uuid', (col) => col.references('collections.id').notNull())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('type', 'varchar(10)', (col) => col.notNull().check(sql`type IN ('newspaper', 'magazine', 'book')`))
    .addColumn('language', 'varchar(50)', (col) => col.notNull())
    .addColumn('metadata', 'jsonb', (col) => col.notNull().defaultTo('{}'))
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('deleted_at', 'timestamptz')
    .execute()

  await sql`
    CREATE TRIGGER set_sources_updated_at
      BEFORE UPDATE ON sources
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `.execute(db)

  await db.schema.createIndex('idx_sources_collection_id').on('sources').column('collection_id').execute()
  await db.schema.createIndex('idx_sources_type').on('sources').column('type').execute()
  await db.schema.createIndex('idx_sources_language').on('sources').column('language').execute()

  // editions
  await db.schema
    .createTable('editions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
    .addColumn('source_id', 'uuid', (col) => col.references('sources.id').notNull())
    .addColumn('number', 'varchar(50)')
    .addColumn('published_at', 'date')
    .addColumn('notes', 'varchar(5000)')
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('deleted_at', 'timestamptz')
    .execute()

  await sql`
    CREATE TRIGGER set_editions_updated_at
      BEFORE UPDATE ON editions
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `.execute(db)

  await db.schema.createIndex('idx_editions_source_id').on('editions').column('source_id').execute()
  await db.schema.createIndex('idx_editions_published_at').on('editions').column('published_at').execute()
}

export const down = async (db: Kysely<unknown>): Promise<void> => {
  await sql`DROP TRIGGER IF EXISTS set_editions_updated_at ON editions;`.execute(db)
  await sql`DROP TRIGGER IF EXISTS set_sources_updated_at ON sources;`.execute(db)
  await sql`DROP TRIGGER IF EXISTS set_collections_updated_at ON collections;`.execute(db)

  await db.schema.dropTable('editions').ifExists().execute()
  await db.schema.dropTable('sources').ifExists().execute()
  await db.schema.dropTable('collections').ifExists().execute()
}

export default { up, down } satisfies Migration
