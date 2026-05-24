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

describeE2E('Users E2E Tests', () => {
  setupE2ETestLifecycle();

  beforeEach(() => {
    // Exception: Promise chaining is preferred, but returning DB cleanup is simple here
    return cleanTestDatabase();
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should signup a new reader user', async () => {
    const signupRes = await fetch('http://localhost:3001/api/users/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Tester User',
        email: 'newtester@example.com',
        password: 'password123',
      }),
    });

    expect(signupRes.status).toBe(201);
    const signupBody = (await signupRes.json()) as { email: string };
    expect(signupBody.email).toBe('newtester@example.com');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should retrieve profile of the seeded manager user', async () => {
    const token = await getAuthToken('manager@teste.com');

    const profileRes = await fetch('http://localhost:3001/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(profileRes.status).toBe(200);
    const profileBody = (await profileRes.json()) as {
      name: string;
      email: string;
    };
    expect(profileBody.name).toBe('Admin Manager');
    expect(profileBody.email).toBe('manager@teste.com');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should update profile details of the seeded reader user', async () => {
    const token = await getAuthToken('reader@teste.com');

    const updateProfileRes = await fetch(
      'http://localhost:3001/api/users/update-profile',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'Updated Reader Name',
        }),
      },
    );

    expect(updateProfileRes.status).toBe(200);
    const updateProfileBody = (await updateProfileRes.json()) as {
      success: boolean;
    };
    expect(updateProfileBody.success).toBe(true);

    // Verify name indeed updated
    const profileAfterUpdateRes = await fetch(
      'http://localhost:3001/api/users/profile',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(profileAfterUpdateRes.status).toBe(200);
    const profileAfterUpdateBody = (await profileAfterUpdateRes.json()) as {
      name: string;
    };
    expect(profileAfterUpdateBody.name).toBe('Updated Reader Name');
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should change user password, revoke sessions, and allow re-authentication with new password', async () => {
    const token = await getAuthToken('reader@teste.com');

    // Change password from 'senha123' to 'senhaNova123'
    const updatePasswordRes = await fetch(
      'http://localhost:3001/api/users/update-password',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: 'senha123',
          password: 'senhaNova123',
          confirm_password: 'senhaNova123',
        }),
      },
    );

    expect(updatePasswordRes.status).toBe(204);

    // Login with old password should fail (sessions revoked + password changed)
    const loginOldRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'reader@teste.com',
        password: 'senha123',
      }),
    });
    expect(loginOldRes.status).toBe(401);

    // Login with new password should succeed
    const loginNewRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'reader@teste.com',
        password: 'senhaNova123',
      }),
    });
    expect(loginNewRes.status).toBe(200);
    const loginNewBody = (await loginNewRes.json()) as { token: string };
    expect(loginNewBody.token).toBeDefined();
  });

  // Exception: E2E scenario requires sequential execution; async/await is used for readability
  test('should sign out and invalidate session', async () => {
    const token = await getAuthToken('reader@teste.com');

    // Sign out
    const signoutRes = await fetch('http://localhost:3001/api/users/signout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(signoutRes.status).toBe(204);

    // Profile request with signed out token should now be unauthorized
    const profileAfterSignout = await fetch(
      'http://localhost:3001/api/users/profile',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    expect(profileAfterSignout.status).toBe(401);
  });
});
