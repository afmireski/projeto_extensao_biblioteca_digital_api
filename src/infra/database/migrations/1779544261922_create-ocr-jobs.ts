import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createType('ocr_job_status')
    .asEnum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'])
    .execute();

  await db.schema
    .createTable('ocr_jobs')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuidv7()`))
    .addColumn('page_id', 'uuid', (col) =>
      col.notNull().references('pages.id').onDelete('cascade'),
    )
    .addColumn('status', sql`ocr_job_status`, (col) => col.notNull())
    .addColumn('attempt', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('error', 'text')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('processing_at', 'timestamptz')
    .addColumn('completed_at', 'timestamptz')
    .addColumn('failed_at', 'timestamptz')
    .addColumn('last_attempt_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await sql`COMMENT ON COLUMN ocr_jobs.created_at IS 'Data em que o servico ficou pendente';`.execute(
    db,
  );

  await db.schema
    .createIndex('idx_ocr_jobs_page_id')
    .on('ocr_jobs')
    .column('page_id')
    .execute();

  await db.schema
    .createIndex('idx_ocr_jobs_status')
    .on('ocr_jobs')
    .column('status')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex('idx_ocr_jobs_status').ifExists().execute();
  await db.schema.dropIndex('idx_ocr_jobs_page_id').ifExists().execute();
  await db.schema.dropTable('ocr_jobs').ifExists().execute();
  await db.schema.dropType('ocr_job_status').ifExists().execute();
}
