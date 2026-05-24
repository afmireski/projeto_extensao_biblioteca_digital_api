import { ConflictError, NotFoundError } from '../../shared/errors/app-errors';

export const editionNotFound = (debug?: unknown) =>
  new NotFoundError('edition', debug, 'pages.edition_not_found');

export const pageNumberConflict = (pageNumber: number, debug?: unknown) =>
  new ConflictError(
    'pages.page_number_conflict',
    `Page number ${pageNumber} is already occupied in this edition`,
    debug,
  );

export const pagesNotFound = (debug?: unknown) =>
  new NotFoundError('pages', debug, 'pages.pages_not_found');
