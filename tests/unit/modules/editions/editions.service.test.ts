import { expect, test, describe, mock, beforeEach } from 'bun:test';
import { EditionsService } from '../../../../src/modules/editions/editions.service';
import type { IEditionsRepository } from '../../../../src/modules/editions/editions.repository.port';
import type { ISourcesRepository } from '../../../../src/modules/sources/sources.repository.port';
import { NotFoundError } from '../../../../src/shared/errors/app-errors';
import type {
  Edition,
  EditionWithSource,
  CreateEditionDTO,
  UpdateEditionDTO,
} from '../../../../src/modules/editions/editions.types';

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

describe('EditionsService', () => {
  let editionsRepository: IEditionsRepository;
  let sourcesRepository: ISourcesRepository;
  let service: EditionsService;

  const mockDate = new Date();
  const fakeSourceId = '00000000-0000-0000-0000-000000000001';

  const makeFakeEdition = (id: string): Edition => ({
    id,
    source_id: fakeSourceId,
    number: '42',
    published_at: '2026-05-29',
    notes: null,
    created_at: mockDate,
    updated_at: mockDate,
    deleted_at: null,
  });

  const makeFakeEditionWithSource = (id: string): EditionWithSource => ({
    ...makeFakeEdition(id),
    source_name: 'Jornal do Brasil',
    source_type: 'newspaper',
    source_language: 'pt-BR',
  });

  beforeEach(() => {
    editionsRepository = {
      create: mock(),
      findById: mock(),
      update: mock(),
      softDelete: mock(),
      list: mock(),
    };
    sourcesRepository = {
      create: mock(),
      findById: mock(),
      update: mock(),
      softDelete: mock(),
      list: mock(),
    };
    service = new EditionsService(editionsRepository, sourcesRepository);
  });

  describe('createEdition', () => {
    test('should validate source existence before creating', async () => {
      const data: CreateEditionDTO = {
        sourceId: fakeSourceId,
        number: '42',
      };
      const fakeSource = {
        id: fakeSourceId,
        collection_id: null,
        name: 'Jornal do Brasil',
        type: 'newspaper' as const,
        language: 'pt-BR',
        metadata: {},
        created_at: mockDate,
        updated_at: mockDate,
        deleted_at: null,
      };
      const expectedEdition = makeFakeEdition('123');

      (sourcesRepository.findById as ReturnType<typeof mock>).mockResolvedValue(
        fakeSource,
      );
      (editionsRepository.create as ReturnType<typeof mock>).mockResolvedValue(
        expectedEdition,
      );

      const result = await service.createEdition(data);

      expect(sourcesRepository.findById).toHaveBeenCalledWith(fakeSourceId);
      expect(editionsRepository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(expectedEdition);
    });

    test('should throw NotFoundError if source does not exist', () => {
      const data: CreateEditionDTO = { sourceId: fakeSourceId };

      (sourcesRepository.findById as ReturnType<typeof mock>).mockResolvedValue(
        undefined,
      );

      return expectError(
        service.createEdition(data),
        NotFoundError,
        'editions.source_not_found',
      ).then(() => {
        expect(editionsRepository.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('getEditionById', () => {
    test('should return EditionWithSource if found', async () => {
      const expected = makeFakeEditionWithSource('123');
      (
        editionsRepository.findById as ReturnType<typeof mock>
      ).mockResolvedValue(expected);

      const result = await service.getEditionById('123');

      expect(editionsRepository.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(expected);
    });

    test('should throw NotFoundError if edition not found or source is deleted', () => {
      (
        editionsRepository.findById as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);

      return expectError(
        service.getEditionById('123'),
        NotFoundError,
        'editions.edition_not_found',
      );
    });
  });

  describe('updateEdition', () => {
    test('should update and return edition if found', async () => {
      const existing = makeFakeEditionWithSource('123');
      const updated = { ...makeFakeEdition('123'), number: '43' };
      const updateData: UpdateEditionDTO = { number: '43' };

      (
        editionsRepository.findById as ReturnType<typeof mock>
      ).mockResolvedValue(existing);
      (editionsRepository.update as ReturnType<typeof mock>).mockResolvedValue(
        updated,
      );

      const result = await service.updateEdition('123', updateData);

      expect(editionsRepository.findById).toHaveBeenCalledWith('123');
      expect(editionsRepository.update).toHaveBeenCalledWith('123', updateData);
      expect(result).toEqual(updated);
    });

    test('should throw NotFoundError if edition does not exist or source is deleted', () => {
      (
        editionsRepository.findById as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);

      return expectError(
        service.updateEdition('123', { number: '43' }),
        NotFoundError,
        'editions.edition_not_found',
      ).then(() => {
        expect(editionsRepository.update).not.toHaveBeenCalled();
      });
    });

    test('should throw NotFoundError if update returns undefined', () => {
      const existing = makeFakeEditionWithSource('123');

      (
        editionsRepository.findById as ReturnType<typeof mock>
      ).mockResolvedValue(existing);
      (editionsRepository.update as ReturnType<typeof mock>).mockResolvedValue(
        undefined,
      );

      return expectError(
        service.updateEdition('123', { number: '43' }),
        NotFoundError,
        'editions.edition_not_found',
      );
    });
  });

  describe('deleteEdition', () => {
    test('should delete edition if found', async () => {
      const existing = makeFakeEditionWithSource('123');

      (
        editionsRepository.findById as ReturnType<typeof mock>
      ).mockResolvedValue(existing);
      (
        editionsRepository.softDelete as ReturnType<typeof mock>
      ).mockResolvedValue(true);

      await service.deleteEdition('123');

      expect(editionsRepository.findById).toHaveBeenCalledWith('123');
      expect(editionsRepository.softDelete).toHaveBeenCalledWith('123');
    });

    test('should throw NotFoundError if edition does not exist or source is deleted', () => {
      (
        editionsRepository.findById as ReturnType<typeof mock>
      ).mockResolvedValue(undefined);

      return expectError(
        service.deleteEdition('123'),
        NotFoundError,
        'editions.edition_not_found',
      ).then(() => {
        expect(editionsRepository.softDelete).not.toHaveBeenCalled();
      });
    });

    test('should throw NotFoundError if softDelete returns false', () => {
      const existing = makeFakeEditionWithSource('123');

      (
        editionsRepository.findById as ReturnType<typeof mock>
      ).mockResolvedValue(existing);
      (
        editionsRepository.softDelete as ReturnType<typeof mock>
      ).mockResolvedValue(false);

      return expectError(
        service.deleteEdition('123'),
        NotFoundError,
        'editions.edition_not_found',
      );
    });
  });

  describe('listEditions', () => {
    test('should delegate to repository.list', async () => {
      const expectedResult = {
        metadata: { total: 0, page: 1, limit: 10 },
        data: [],
      };

      (editionsRepository.list as ReturnType<typeof mock>).mockResolvedValue(
        expectedResult,
      );

      const result = await service.listEditions(
        { source_id: { eq: 'source-uuid-1' } },
        {},
        { page: 1, limit: 10, offset: 0 },
      );

      expect(editionsRepository.list).toHaveBeenCalledWith(
        { source_id: { eq: 'source-uuid-1' } },
        {},
        { page: 1, limit: 10, offset: 0 },
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
