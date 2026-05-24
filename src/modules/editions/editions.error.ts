import { NotFoundError } from '../../shared/errors/app-errors';

export const editionNotFound = (debug?: unknown) =>
  new NotFoundError('edition', debug, 'editions.edition_not_found');

export const sourceNotFound = (debug?: unknown) =>
  new NotFoundError('source', debug, 'editions.source_not_found');
