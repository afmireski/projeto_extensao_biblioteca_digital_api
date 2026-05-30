import { describe, test, expect, beforeEach } from 'bun:test';
import { setupE2ETestLifecycle, cleanTestDatabase } from './e2e-setup';

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
      type: 'magazine',
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

describeE2E('Editions E2E Tests', () => {
  setupE2ETestLifecycle();

  let managerToken: string;
  let sourceId: string;

  beforeEach(async () => {
    // Exception: sequential prep steps for E2E
    await cleanTestDatabase();
    managerToken = await getAuthToken('manager@teste.com');
    sourceId = await createTestSource(managerToken, 'Revista de Teste');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should create an edition successfully', async () => {
    const createRes = await fetch('http://localhost:3001/api/editions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({
        source_id: sourceId,
        number: 'Ano I N1',
        published_at: '1985-05-15',
        notes: 'Edição de lançamento',
      }),
    });

    expect(createRes.status).toBe(201);
    const edition = (await createRes.json()) as {
      number: string;
      notes: string;
    };
    expect(edition.number).toBe('Ano I N1');
    expect(edition.notes).toBe('Edição de lançamento');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should retrieve an edition by ID', async () => {
    const editionId = await createTestEdition(
      managerToken,
      sourceId,
      'Ano I N2',
    );

    const getRes = await fetch(
      `http://localhost:3001/api/editions/${editionId}`,
      {
        headers: { Authorization: `Bearer ${managerToken}` },
      },
    );
    expect(getRes.status).toBe(200);
    const edition = (await getRes.json()) as { number: string };
    expect(edition.number).toBe('Ano I N2');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should list editions of a source', async () => {
    const editionId = await createTestEdition(
      managerToken,
      sourceId,
      'Ano I N3',
    );

    const listRes = await fetch(
      `http://localhost:3001/api/editions/list?filters=${encodeURIComponent(
        JSON.stringify({ source_id: { eq: sourceId } }),
      )}`,
      {
        headers: { Authorization: `Bearer ${managerToken}` },
      },
    );
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as {
      data: Array<{ id: string; number: string }>;
    };
    expect(listBody.data.length).toBeGreaterThan(0);
    const found = listBody.data.find((e) => e.id === editionId);
    expect(found).toBeDefined();
    expect(found!.number).toBe('Ano I N3');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should update edition properties', async () => {
    const editionId = await createTestEdition(
      managerToken,
      sourceId,
      'Ano I N4',
    );

    const updateRes = await fetch(
      `http://localhost:3001/api/editions/${editionId}/update`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${managerToken}`,
        },
        body: JSON.stringify({
          number: 'Ano I N4-Atualizado',
          notes: 'Notas editadas',
        }),
      },
    );
    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json()) as {
      number: string;
      notes: string;
    };
    expect(updated.number).toBe('Ano I N4-Atualizado');
    expect(updated.notes).toBe('Notas editadas');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should delete an edition', async () => {
    const editionId = await createTestEdition(
      managerToken,
      sourceId,
      'Ano I N5',
    );

    const deleteRes = await fetch(
      `http://localhost:3001/api/editions/${editionId}/delete`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${managerToken}` },
      },
    );
    expect(deleteRes.status).toBe(204);

    const getRes = await fetch(
      `http://localhost:3001/api/editions/${editionId}`,
      {
        headers: { Authorization: `Bearer ${managerToken}` },
      },
    );
    expect(getRes.status).toBe(404);
  });
});
