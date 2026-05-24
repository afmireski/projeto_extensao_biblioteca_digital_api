import { expect, test, describe, mock, beforeEach } from 'bun:test';
import { SourcesService } from '../../../../src/modules/sources/sources.service';
import type { ISourcesRepository } from '../../../../src/modules/sources/sources.repository.port';
import { NotFoundError } from '../../../../src/shared/errors/app-errors';
import type {
  Source,
  CreateSourceDTO,
  UpdateSourceDTO,
} from '../../../../src/modules/sources/sources.types';

const expectError = (
  promise: Promise<unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorClass: new (...args: any[]) => any,
  code: string,
): Promise<void> => {
  return promise.then(
    () => {
      throw new Error('Expected promise to be rejected');
    },
    (err) => {
      expect(err).toBeInstanceOf(errorClass);
      expect((err as { code?: string }).code).toBe(code);
    },
  );
};

describe('SourcesService', () => {
  let repository: ISourcesRepository;
  let service: SourcesService;

  const mockDate = new Date();

  const makeFakeSource = (id: string): Source => ({
    id,
    collection_id: null,
    name: 'Fake Source',
    type: 'newspaper',
    language: 'pt-BR',
    metadata: {},
    created_at: mockDate,
    updated_at: mockDate,
    deleted_at: null,
  });

  beforeEach(() => {
    repository = {
      create: mock(),
      findById: mock(),
      update: mock(),
      softDelete: mock(),
      list: mock(),
    };
    service = new SourcesService(repository);
  });

  describe('createSource', () => {
    test('should delegate to repository.create', async () => {
      const data: CreateSourceDTO = {
        name: 'New Source',
        type: 'book',
        language: 'en',
        metadata: {},
      };
      const expectedSource = makeFakeSource('123');

      (repository.create as ReturnType<typeof mock>).mockResolvedValue(
        expectedSource,
      );

      const result = await service.createSource(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(expectedSource);
    });
  });

  describe('getSourceById', () => {
    test('should return source if found', async () => {
      const expectedSource = makeFakeSource('123');
      (repository.findById as ReturnType<typeof mock>).mockResolvedValue(
        expectedSource,
      );

      const result = await service.getSourceById('123');

      expect(repository.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(expectedSource);
    });

    test('should throw NotFoundError if not found', () => {
      (repository.findById as ReturnType<typeof mock>).mockResolvedValue(
        undefined,
      );

      return expectError(
        service.getSourceById('123'),
        NotFoundError,
        'sources.source_not_found',
      ).then(() => {
        expect(repository.findById).toHaveBeenCalledWith('123');
      });
    });
  });

  describe('updateSource', () => {
    test('should update and return source if found', async () => {
      const existingSource = makeFakeSource('123');
      const updatedSource = { ...existingSource, name: 'Updated' };
      const updateData: UpdateSourceDTO = { name: 'Updated' };

      (repository.findById as ReturnType<typeof mock>).mockResolvedValue(
        existingSource,
      );
      (repository.update as ReturnType<typeof mock>).mockResolvedValue(
        updatedSource,
      );

      const result = await service.updateSource('123', updateData);

      expect(repository.findById).toHaveBeenCalledWith('123');
      expect(repository.update).toHaveBeenCalledWith('123', updateData);
      expect(result).toEqual(updatedSource);
    });

    test('should throw NotFoundError if source does not exist', () => {
      (repository.findById as ReturnType<typeof mock>).mockResolvedValue(
        undefined,
      );

      return expectError(
        service.updateSource('123', { name: 'Updated' }),
        NotFoundError,
        'sources.source_not_found',
      ).then(() => {
        expect(repository.update).not.toHaveBeenCalled();
      });
    });

    test('should throw NotFoundError if update fails (returns undefined)', () => {
      const existingSource = makeFakeSource('123');
      (repository.findById as ReturnType<typeof mock>).mockResolvedValue(
        existingSource,
      );
      (repository.update as ReturnType<typeof mock>).mockResolvedValue(
        undefined,
      );

      return expectError(
        service.updateSource('123', { name: 'Updated' }),
        NotFoundError,
        'sources.source_not_found',
      );
    });
  });

  describe('deleteSource', () => {
    test('should delete source if found', async () => {
      const existingSource = makeFakeSource('123');

      (repository.findById as ReturnType<typeof mock>).mockResolvedValue(
        existingSource,
      );
      (repository.softDelete as ReturnType<typeof mock>).mockResolvedValue(
        true,
      );

      await service.deleteSource('123');

      expect(repository.findById).toHaveBeenCalledWith('123');
      expect(repository.softDelete).toHaveBeenCalledWith('123');
    });

    test('should throw NotFoundError if source does not exist', () => {
      (repository.findById as ReturnType<typeof mock>).mockResolvedValue(
        undefined,
      );

      return expectError(
        service.deleteSource('123'),
        NotFoundError,
        'sources.source_not_found',
      ).then(() => {
        expect(repository.softDelete).not.toHaveBeenCalled();
      });
    });

    test('should throw NotFoundError if softDelete returns false', () => {
      const existingSource = makeFakeSource('123');

      (repository.findById as ReturnType<typeof mock>).mockResolvedValue(
        existingSource,
      );
      (repository.softDelete as ReturnType<typeof mock>).mockResolvedValue(
        false,
      );

      return expectError(
        service.deleteSource('123'),
        NotFoundError,
        'sources.source_not_found',
      );
    });
  });

  describe('listSources', () => {
    test('should delegate to repository.list', async () => {
      const expectedResult = {
        metadata: { total: 0, page: 1, limit: 10 },
        data: [],
      };

      (repository.list as ReturnType<typeof mock>).mockResolvedValue(
        expectedResult,
      );

      const result = await service.listSources(
        {},
        {},
        { page: 1, limit: 10, offset: 0 },
      );

      expect(repository.list).toHaveBeenCalledWith(
        {},
        {},
        { page: 1, limit: 10, offset: 0 },
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
