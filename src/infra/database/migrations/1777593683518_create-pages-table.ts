import type { Kysely, Migration } from 'kysely';
import { sql } from 'kysely';

export const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable('pages')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
    .addColumn('edition_id', 'uuid', (col) =>
      col.notNull().references('editions.id'),
    )
    .addColumn('number', 'integer', (col) => col.notNull())
    .addColumn('original_image_path', 'varchar(255)', (col) => col.notNull())
    .addColumn('display_image_path', 'varchar(255)')
    .addColumn('thumb_image_path', 'varchar(255)')
    .addColumn('ocr_status', 'varchar(50)', (col) =>
      col.notNull().defaultTo('waiting'),
    )
    .addColumn('ocr_confidence', sql`numeric(4,3)`)
    .addColumn('ocr_raw', 'jsonb')
    .addColumn('tsv_content', sql`tsvector`)
    .addColumn('deleted_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addUniqueConstraint('pages_edition_id_number_unique', [
      'edition_id',
      'number',
    ])
    .execute();

  await db.schema
    .createIndex('pages_tsv_idx')
    .on('pages')
    .using('gin')
    .column('tsv_content')
    .execute();

  await db.schema
    .createIndex('pages_edition_idx')
    .on('pages')
    .column('edition_id')
    .execute();

  await db.schema
    .createIndex('pages_status_idx')
    .on('pages')
    .column('ocr_status')
    .execute();

  await sql`
    CREATE OR REPLACE FUNCTION atualiza_tsv() RETURNS trigger AS $$
    BEGIN
      NEW.tsv_content := to_tsvector('portuguese', COALESCE(NEW.ocr_raw->>'full_text', ''));
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `.execute(db);

  await sql`
    CREATE TRIGGER tgr_page_tsv
      BEFORE INSERT OR UPDATE OF ocr_raw ON pages
      FOR EACH ROW EXECUTE FUNCTION atualiza_tsv();
  `.execute(db);

  await sql`
    CREATE TRIGGER set_pages_updated_at
      BEFORE UPDATE ON pages
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `.execute(db);
};

export const down = async (db: Kysely<unknown>): Promise<void> => {
  await sql`DROP TRIGGER IF EXISTS set_pages_updated_at ON pages;`.execute(db);
  await sql`DROP TRIGGER IF EXISTS tgr_page_tsv ON pages;`.execute(db);
  await sql`DROP FUNCTION IF EXISTS atualiza_tsv();`.execute(db);

  await db.schema.dropIndex('pages_status_idx').ifExists().execute();
  await db.schema.dropIndex('pages_edition_idx').ifExists().execute();
  await db.schema.dropIndex('pages_tsv_idx').ifExists().execute();

  await db.schema.dropTable('pages').ifExists().execute();
};

export default { up, down } satisfies Migration;
