import { describe, test, expect, beforeEach } from 'bun:test';
import { setupE2ETestLifecycle, cleanTestDatabase } from './e2e-setup';

const isE2E = process.env.RUN_E2E === 'true';
const describeE2E = isE2E ? describe : describe.skip;

describeE2E('Auth E2E Tests', () => {
  setupE2ETestLifecycle();

  beforeEach(() => {
    // Exception: Promise chaining is preferred, but returning DB cleanup is simple here
    return cleanTestDatabase();
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should login successfully as manager', async () => {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager@teste.com',
        password: 'senha123',
      }),
    });

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      token: string;
      email: string;
      name: string;
    };
    expect(body.token).toBeDefined();
    expect(body.email).toBe('manager@teste.com');
    expect(body.name).toBe('Admin Manager');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should login successfully as reader', async () => {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'reader@teste.com',
        password: 'senha123',
      }),
    });

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      token: string;
      email: string;
      name: string;
    };
    expect(body.token).toBeDefined();
    expect(body.email).toBe('reader@teste.com');
    expect(body.name).toBe('Reader User');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should fail login with invalid password', async () => {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager@teste.com',
        password: 'wrongpassword',
      }),
    });

    expect(response.status).toBe(401);

    const body = (await response.json()) as { code: string; message: string };
    expect(body.code).toBe('auth.invalid_credentials');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should fail login with non-existent email', async () => {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@teste.com',
        password: 'senha123',
      }),
    });

    expect(response.status).toBe(401);

    const body = (await response.json()) as { code: string; message: string };
    expect(body.code).toBe('auth.invalid_credentials');
  });
});
