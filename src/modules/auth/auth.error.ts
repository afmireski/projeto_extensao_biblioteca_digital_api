import { UnauthorizedError } from '../../shared/errors/app-errors';

export const invalidCredentials = (debug?: unknown) =>
  new UnauthorizedError(
    'Invalid email or password',
    debug,
    'auth.invalid_credentials',
  );
