import type { IPagesRepository } from './pages.repository.port';
import { generateVariants } from '../../infra/image/image.processor';
import { AppError, InternalError } from '../../shared/errors/app-errors';
import {
  editionNotFound,
  pageNumberConflict,
  pagesNotFound,
} from './pages.error';
import type { OcrFacade } from '../ocr/ocr.facade';
import type {
  PageEntity,
  UploadFileDTO,
  ListPagesFilters,
  ListPagesOrderParams,
  PageResultDTO,
} from './pages.types';
import type { PaginationParams } from '../../shared/types/query';
import { logger } from '../../shared/logger';
import type { IStorageAdapter } from '../../infra/storage/storage.interface';
import { randomUUIDv7 } from 'bun';

/**
 * Service orchestrating page lifecycle actions.
 * Processes uploaded files, stores them, updates database, schedules OCR, and deletes batch pages.
 */
export class PagesService {
  constructor(
    private readonly pagesRepository: IPagesRepository,
    private readonly storageAdapter: IStorageAdapter,
    private readonly ocrFacade: OcrFacade,
  ) {}

  /**
   * Processes a page upload request.
   * Generates variants (original, display, thumbnail), uploads them to storage,
   * creates the page database entry, and queues an asynchronous OCR job.
   * @param editionId - The UUID of the parent edition.
   * @param file - The uploaded file DTO (Multer file).
   * @param pageNumber - The page number in sequence.
   * @returns A promise resolving to the created PageEntity.
   */
  uploadPage(
    editionId: string,
    file: UploadFileDTO,
    pageNumber: number,
  ): Promise<PageEntity> {
    const key = randomUUIDv7();

    return this.pagesRepository
      .checkIfCanUpload(editionId, pageNumber)
      .then(({ hasEdition, pageNumberConflicts }) => {
        if (!hasEdition) {
          throw editionNotFound();
        }
        if (pageNumberConflicts) {
          throw pageNumberConflict(pageNumber);
        }
        return generateVariants(file);
      })
      .then(({ original, display, thumb }) => {
        const ext = original.originalname.split('.').pop() || 'bin';
        return Promise.all([
          this.storageAdapter.upload(
            'pages-originals',
            `${key}/original.${ext}`,
            original.buffer,
            original.mimetype,
          ),
          this.storageAdapter.upload(
            'pages-display',
            `${key}/display.webp`,
            display,
            'image/webp',
          ),
          this.storageAdapter.upload(
            'pages-thumb',
            `${key}/thumb.webp`,
            thumb,
            'image/webp',
          ),
        ]);
      })
      .then(([originalRes, displayRes, thumbRes]) => {
        return this.pagesRepository.create({
          edition_id: editionId,
          number: pageNumber,
          original_image_path: originalRes.path,
          display_image_path: displayRes.path,
          thumb_image_path: thumbRes.path,
        });
      })
      .then((page) => {
        void this.ocrFacade.scheduleOcrJob(page.id).catch((err) => {
          logger.error(
            { err, pageId: page.id },
            'Failed to schedule OCR job asynchronously',
          );
        });
        return page;
      })
      .catch((err) => {
        if (err instanceof AppError) throw err;
        logger.error({ err, editionId }, 'Failed to upload page');
        throw new InternalError({ cause: err });
      });
  }

  /**
   * Retrieves a filtered, ordered, and paginated list of pages.
   * Enriches display and thumb image paths with public storage URLs.
   * @param filters - Search filters.
   * @param order - Ordering criteria.
   * @param pagination - Pagination bounds.
   * @returns A promise resolving to the mapped page list result DTO.
   */
  list(
    filters?: ListPagesFilters,
    order?: ListPagesOrderParams,
    pagination?: PaginationParams,
  ) {
    return this.pagesRepository
      .list(filters, order, pagination)
      .then(({ data, total }) => {
        const storageEndpoint = process.env.STORAGE_ENDPOINT ?? '';

        const mappedPages = data.map((p) => {
          const {
            original_image_path: _,
            display_image_path,
            thumb_image_path,
            ...rest
          } = p;
          return {
            ...rest,
            display_image_url: display_image_path
              ? `${storageEndpoint}/${display_image_path}`
              : null,
            thumb_image_url: thumb_image_path
              ? `${storageEndpoint}/${thumb_image_path}`
              : null,
          } satisfies PageResultDTO;
        });

        return {
          metadata: {
            total,
            page: pagination?.page || 1,
            limit: pagination?.limit || data.length,
          },
          data: mappedPages,
        };
      })
      .catch((err) => {
        logger.error({ err, filters }, 'Failed to list pages');
        throw new InternalError({ cause: err });
      });
  }

  /**
   * Physically deletes a batch of pages from both database and file storage.
   * Throws NotFoundError if none of the IDs exist in the database.
   * @param pageIds - Array of page UUIDs.
   * @returns A promise resolving to void.
   */
  deleteBatch(pageIds: string[]): Promise<void> {
    return this.pagesRepository
      .deleteManyByIds(pageIds)
      .then((deletedPages) => {
        if (deletedPages.length === 0) {
          throw pagesNotFound();
        }

        const deletePromises = deletedPages.flatMap((p) => {
          const paths = [];
          if (p.original_image_path)
            paths.push(
              this.storageAdapter.delete(
                'pages-originals',
                p.original_image_path.replace('pages-originals/', ''),
              ),
            );
          if (p.display_image_path)
            paths.push(
              this.storageAdapter.delete(
                'pages-display',
                p.display_image_path.replace('pages-display/', ''),
              ),
            );
          if (p.thumb_image_path)
            paths.push(
              this.storageAdapter.delete(
                'pages-thumb',
                p.thumb_image_path.replace('pages-thumb/', ''),
              ),
            );
          return paths;
        });

        return Promise.allSettled(deletePromises);
      })
      .then((results) => {
        const failures = results.filter((r) => r.status === 'rejected');
        if (failures.length > 0) {
          logger.warn(
            { failures },
            'Failed to delete some physical files from storage',
          );
        }
      })
      .catch((err) => {
        if (err instanceof AppError) throw err;
        logger.error({ err, pageIds }, 'Failed to delete batch pages');
        throw new InternalError({ cause: err });
      });
  }
}
