import { NotFoundError } from '../../shared/errors/app-errors';

export const ocrJobNotFound = (debug?: unknown) =>
  new NotFoundError('ocr_job', debug, 'ocr.ocr_job_not_found');
