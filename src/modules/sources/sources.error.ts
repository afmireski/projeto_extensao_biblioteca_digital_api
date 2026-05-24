import { NotFoundError } from '../../shared/errors/app-errors';

export const sourceNotFound = (debug?: unknown) =>
  new NotFoundError('source', debug, 'sources.source_not_found');
