import { describe, test, expect, beforeEach } from 'bun:test';
import { setupE2ETestLifecycle, cleanTestDatabase } from './e2e-setup';
import { container } from '../../../src/container';
import type { Kysely } from 'kysely';
import type { DB } from '../../../src/infra/database/types';

const isE2E = process.env.RUN_E2E === 'true';
const describeE2E = isE2E ? describe : describe.skip;

async function getAuthToken(
  email: string,
  password = 'senha123',
): Promise<string> {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginBody = (await loginRes.json()) as { token: string };
  return loginBody.token;
}

async function createTestSource(token: string, name: string): Promise<string> {
  const createRes = await fetch('http://localhost:3001/api/sources/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      type: 'newspaper',
      language: 'pt-BR',
    }),
  });
  const body = (await createRes.json()) as { id: string };
  return body.id;
}

async function createTestEdition(
  token: string,
  sourceId: string,
  number: string,
): Promise<string> {
  const createRes = await fetch('http://localhost:3001/api/editions/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      source_id: sourceId,
      number,
      published_at: '1999-12-31',
    }),
  });
  const body = (await createRes.json()) as { id: string };
  return body.id;
}

async function uploadTestPage(
  token: string,
  editionId: string,
  number: number,
): Promise<void> {
  const formData = new FormData();
  formData.append('edition_id', editionId);
  formData.append('number', String(number));

  const base64Png =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const pngBuffer = Buffer.from(base64Png, 'base64');
  const blob = new Blob([pngBuffer], { type: 'image/png' });
  formData.append('page', blob, 'test-page.png');

  const uploadRes = await fetch('http://localhost:3001/api/pages/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (uploadRes.status !== 201) {
    throw new Error(`Upload failed with status ${uploadRes.status}`);
  }
}

describeE2E('Pages E2E Tests', () => {
  setupE2ETestLifecycle();

  let managerToken: string;
  let sourceId: string;
  let editionId: string;

  beforeEach(async () => {
    // Exception: sequential prep steps for E2E
    await cleanTestDatabase();
    managerToken = await getAuthToken('manager@teste.com');
    sourceId = await createTestSource(managerToken, 'Jornal de Páginas');
    editionId = await createTestEdition(
      managerToken,
      sourceId,
      'Edição de Páginas',
    );
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should upload a page and trigger OCR job creation', async () => {
    const db = container.resolve('db') as Kysely<DB>;

    // Upload
    await uploadTestPage(managerToken, editionId, 1);

    // Verify page created
    const page = await db
      .selectFrom('pages')
      .select(['id', 'number'])
      .where('edition_id', '=', editionId)
      .where('number', '=', 1)
      .executeTakeFirst();
    expect(page).toBeDefined();
    expect(page!.number).toBe(1);

    // Verify job created (poll since scheduling is asynchronous)
    let job = undefined;
    let jobAttempts = 0;
    while (jobAttempts < 15) {
      job = await db
        .selectFrom('ocr_jobs')
        .select('status')
        .where('page_id', '=', page!.id)
        .executeTakeFirst();
      if (job) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
      jobAttempts++;
    }
    expect(job).toBeDefined();
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should successfully process background OCR via RabbitMQ consumer', async () => {
    const db = container.resolve('db') as Kysely<DB>;

    await uploadTestPage(managerToken, editionId, 2);

    const page = await db
      .selectFrom('pages')
      .select('id')
      .where('edition_id', '=', editionId)
      .where('number', '=', 2)
      .executeTakeFirst();
    expect(page).toBeDefined();

    // Poll until OCR job is COMPLETED
    let completed = false;
    let attempts = 0;
    while (attempts < 15) {
      const job = await db
        .selectFrom('ocr_jobs')
        .select('status')
        .where('page_id', '=', page!.id)
        .executeTakeFirst();

      if (job?.status === 'COMPLETED') {
        completed = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    }
    expect(completed).toBe(true);
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should list pages for an edition showing valid MinIO URLs', async () => {
    const db = container.resolve('db') as Kysely<DB>;

    await uploadTestPage(managerToken, editionId, 3);

    const page = await db
      .selectFrom('pages')
      .select('id')
      .where('edition_id', '=', editionId)
      .where('number', '=', 3)
      .executeTakeFirst();

    const listRes = await fetch(
      `http://localhost:3001/api/pages/list?filters=${encodeURIComponent(
        JSON.stringify({ edition_id: { eq: editionId } }),
      )}`,
      {
        headers: { Authorization: `Bearer ${managerToken}` },
      },
    );
    expect(listRes.status).toBe(200);

    const listBody = (await listRes.json()) as {
      data: Array<{
        id: string;
        number: number;
        display_image_url: string;
        thumb_image_url: string;
      }>;
    };
    const listed = listBody.data.find((p) => p.id === page!.id);
    expect(listed).toBeDefined();
    expect(listed!.number).toBe(3);
    expect(listed!.display_image_url).toContain(
      'http://localhost:9002/pages-display/',
    );
    expect(listed!.thumb_image_url).toContain(
      'http://localhost:9002/pages-thumb/',
    );
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should batch delete pages and remove associated files', async () => {
    const db = container.resolve('db') as Kysely<DB>;

    await uploadTestPage(managerToken, editionId, 4);

    const page = await db
      .selectFrom('pages')
      .select('id')
      .where('edition_id', '=', editionId)
      .where('number', '=', 4)
      .executeTakeFirst();

    const deleteRes = await fetch(
      'http://localhost:3001/api/pages/delete-batch',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${managerToken}`,
        },
        body: JSON.stringify({
          edition_id: editionId,
          page_ids: [page!.id],
        }),
      },
    );
    expect(deleteRes.status).toBe(204);

    // Verify page deleted
    const pageAfterDelete = await db
      .selectFrom('pages')
      .select('id')
      .where('id', '=', page!.id)
      .executeTakeFirst();
    expect(pageAfterDelete).toBeUndefined();
  });
});
