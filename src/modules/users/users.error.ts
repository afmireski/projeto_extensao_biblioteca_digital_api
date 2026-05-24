import {
  ConflictError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
} from '../../shared/errors/app-errors';

export const emailConflict = (email: string, debug?: unknown) =>
  new ConflictError(
    'users.email_conflict',
    `Email '${email}' already in use`,
    debug,
  );

export const userNotFound = (debug?: unknown) =>
  new NotFoundError('user', debug, 'users.user_not_found');

export const invalidOldPassword = (debug?: unknown) =>
  new UnauthorizedError(
    'Invalid old password',
    debug,
    'users.invalid_old_password',
  );

export const passwordsDoNotMatch = (debug?: unknown) =>
  new ValidationError(
    'Passwords do not match',
    undefined,
    debug,
    'users.passwords_do_not_match',
  );
