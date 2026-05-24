import { beforeAll, afterAll } from 'bun:test';
import { app } from '../../../src/app';
import { container } from '../../../src/container';
import type { IQueueService } from '../../../src/infra/queue/queue.interface';
import type { OcrConsumer } from '../../../src/modules/ocr/ocr.consumer';
import { sql, type Kysely } from 'kysely';
import type { Server } from 'http';
import type { DB } from '../../../src/infra/database/types';

let serverInstance: Server | null = null;

export function validateE2EEnvironment() {
  if (process.env.RUN_E2E !== 'true') {
    throw new Error('CRITICAL SAFETY ERROR: RUN_E2E is not set to "true".');
  }
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('CRITICAL SAFETY ERROR: NODE_ENV is not set to "test".');
  }
  if (
    process.env.DATABASE_URL !==
    'postgres://biblioteca:biblioteca@localhost:5433/biblioteca_db_test'
  ) {
    throw new Error(
      `CRITICAL SAFETY ERROR: DATABASE_URL must be exactly 'postgres://biblioteca:biblioteca@localhost:5433/biblioteca_db_test'. Got: ${process.env.DATABASE_URL}`,
    );
  }
  if (process.env.STORAGE_ENDPOINT !== 'http://localhost:9002') {
    throw new Error(
      `CRITICAL SAFETY ERROR: STORAGE_ENDPOINT must be exactly 'http://localhost:9002'. Got: ${process.env.STORAGE_ENDPOINT}`,
    );
  }
  if (process.env.RABBITMQ_URL !== 'amqp://guest:guest@localhost:5673') {
    throw new Error(
      `CRITICAL SAFETY ERROR: RABBITMQ_URL must be exactly 'amqp://guest:guest@localhost:5673'. Got: ${process.env.RABBITMQ_URL}`,
    );
  }
  if (process.env.PORT !== '3001') {
    throw new Error(
      `CRITICAL SAFETY ERROR: PORT must be exactly '3001'. Got: ${process.env.PORT}`,
    );
  }
}

let defaultPasswordHash: string | null = null;

export async function cleanTestDatabase() {
  if (process.env.RUN_E2E !== 'true') {
    return;
  }

  const db = container.resolve('db') as Kysely<DB>;
  // Delete all sessions, ocr_jobs, editions, sources, collections
  await sql`TRUNCATE TABLE sessions, ocr_jobs, editions, sources, collections CASCADE`.execute(
    db,
  );
  // Delete non-seeded users
  await sql`DELETE FROM users WHERE email NOT IN ('manager@teste.com', 'reader@teste.com')`.execute(
    db,
  );

  // Lazily hash default password once
  if (!defaultPasswordHash) {
    defaultPasswordHash = await Bun.password.hash('senha123');
  }

  // Reset seeded users passwords and names to default values to revert any profile update/password change tests
  await db
    .updateTable('users')
    .set({ password_hash: defaultPasswordHash })
    .execute();

  await db
    .updateTable('users')
    .set({ name: 'Admin Manager' })
    .where('email', '=', 'manager@teste.com')
    .execute();

  await db
    .updateTable('users')
    .set({ name: 'Reader User' })
    .where('email', '=', 'reader@teste.com')
    .execute();
}

export function setupE2ETestLifecycle() {
  // If not E2E run, do not register beforeAll/afterAll hooks to prevent errors in unit tests
  if (process.env.RUN_E2E !== 'true') {
    return;
  }

  beforeAll(async () => {
    validateE2EEnvironment();

    const queueService = container.resolve('queueService') as IQueueService;
    const ocrConsumer = container.resolve('ocrConsumer') as OcrConsumer;

    await queueService.connect();
    await ocrConsumer.start();

    await new Promise<void>((resolve) => {
      serverInstance = app.listen(3001, () => {
        resolve();
      });
    });
  });

  afterAll(async () => {
    console.log('--- STARTING E2E TEARDOWN ---');
    if (serverInstance) {
      console.log('Closing Express server...');
      // Force close any active keep-alive connections to prevent test runner from hanging
      if ('closeAllConnections' in serverInstance) {
        (
          serverInstance as unknown as { closeAllConnections: () => void }
        ).closeAllConnections();
      }
      await new Promise<void>((resolve) => {
        serverInstance!.close(() => {
          console.log('Express server closed.');
          resolve();
        });
      });
    }
    console.log('--- E2E TEARDOWN COMPLETE ---');
  });
}
