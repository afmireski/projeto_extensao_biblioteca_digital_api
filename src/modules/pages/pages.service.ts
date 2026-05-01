import type { IPagesRepository } from './pages.repository.port';
import { generateVariants } from '../../infra/image/image.processor';
import { InternalError, NotFoundError } from '../../shared/errors/app-errors';
import type {
  CreatePageDTO,
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

export class PagesService {
  constructor(
    private readonly pagesRepository: IPagesRepository,
    private readonly storageAdapter: IStorageAdapter,
  ) {}

  uploadBatch(
    editionId: string,
    files: UploadFileDTO[],
    startingNumber: number,
  ): Promise<PageEntity[]> {
    const uploadPromises = files.map((file, index) => {
      const pageNumber = startingNumber + index;
      const key = randomUUIDv7();

      return generateVariants(file)
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
          return {
            edition_id: editionId,
            number: pageNumber,
            original_image_path: originalRes.path,
            display_image_path: displayRes.path,
            thumb_image_path: thumbRes.path,
          } satisfies CreatePageDTO;
        });
    });

    return Promise.all(uploadPromises)
      .then((createDtos) => this.pagesRepository.createMany(createDtos))
      .catch((err) => {
        logger.error({ err, editionId }, 'Failed to upload batch pages');
        throw new InternalError({ cause: err });
      });
  }

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

  deleteBatch(pageIds: string[]): Promise<void> {
    return this.pagesRepository
      .deleteManyByIds(pageIds)
      .then((deletedPages) => {
        if (deletedPages.length === 0) {
          throw new NotFoundError('pages');
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
        if (err instanceof NotFoundError) throw err;
        logger.error({ err, pageIds }, 'Failed to delete batch pages');
        throw new InternalError({ cause: err });
      });
  }
}
