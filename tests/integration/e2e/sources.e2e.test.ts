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
      type: 'newspaper',
      language: 'pt-BR',
    }),
  });
  const body = (await createRes.json()) as { id: string };
  return body.id;
}

describeE2E('Sources E2E Tests', () => {
  setupE2ETestLifecycle();

  let managerToken: string;

  beforeEach(async () => {
    // Exception: sequential prep steps for E2E
    await cleanTestDatabase();
    managerToken = await getAuthToken('manager@teste.com');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should create a source successfully', async () => {
    const createRes = await fetch('http://localhost:3001/api/sources/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({
        name: 'Gazeta do Povo',
        type: 'newspaper',
        language: 'pt-BR',
        metadata: { city: 'Curitiba' },
      }),
    });

    expect(createRes.status).toBe(201);
    const source = (await createRes.json()) as { name: string; type: string };
    expect(source.name).toBe('Gazeta do Povo');
    expect(source.type).toBe('newspaper');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should retrieve a source by ID', async () => {
    const sourceId = await createTestSource(managerToken, 'Gazeta para Buscar');

    const getRes = await fetch(
      `http://localhost:3001/api/sources/${sourceId}`,
      {
        headers: { Authorization: `Bearer ${managerToken}` },
      },
    );
    expect(getRes.status).toBe(200);
    const source = (await getRes.json()) as { name: string };
    expect(source.name).toBe('Gazeta para Buscar');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should list all sources', async () => {
    const sourceId = await createTestSource(managerToken, 'Gazeta para Listar');

    const listRes = await fetch('http://localhost:3001/api/sources/list', {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as {
      data: Array<{ id: string; name: string }>;
    };
    expect(listBody.data.length).toBeGreaterThan(0);
    const found = listBody.data.find((s) => s.id === sourceId);
    expect(found).toBeDefined();
    expect(found!.name).toBe('Gazeta para Listar');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should update source properties', async () => {
    const sourceId = await createTestSource(managerToken, 'Gazeta Antiga');

    const updateRes = await fetch(
      `http://localhost:3001/api/sources/${sourceId}/update`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${managerToken}`,
        },
        body: JSON.stringify({
          name: 'Gazeta Nova',
          language: 'pt',
        }),
      },
    );
    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json()) as {
      name: string;
      language: string;
    };
    expect(updated.name).toBe('Gazeta Nova');
    expect(updated.language).toBe('pt');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should delete a source', async () => {
    const sourceId = await createTestSource(
      managerToken,
      'Gazeta para Deletar',
    );

    const deleteRes = await fetch(
      `http://localhost:3001/api/sources/${sourceId}/delete`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${managerToken}` },
      },
    );
    expect(deleteRes.status).toBe(204);

    const getRes = await fetch(
      `http://localhost:3001/api/sources/${sourceId}`,
      {
        headers: { Authorization: `Bearer ${managerToken}` },
      },
    );
    expect(getRes.status).toBe(404);
  });
});
