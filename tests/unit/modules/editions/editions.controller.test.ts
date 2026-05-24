import { expect, test, describe, mock, beforeEach } from 'bun:test';
import type { Request, Response, NextFunction } from 'express';
import { EditionsController } from '../../../../src/modules/editions/editions.controller';
import { EditionsService } from '../../../../src/modules/editions/editions.service';
import type { IEditionsRepository } from '../../../../src/modules/editions/editions.repository.port';
import type { ISourcesRepository } from '../../../../src/modules/sources/sources.repository.port';
import type { EditionWithSource } from '../../../../src/modules/editions/editions.types';

describe('EditionsController', () => {
  let controller: EditionsController;
  let service: EditionsService;

  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  const mockDate = new Date();
  const fakeEdition: EditionWithSource = {
    id: '123',
    source_id: '00000000-0000-0000-0000-000000000001',
    number: '42',
    published_at: mockDate,
    notes: null,
    created_at: mockDate,
    updated_at: mockDate,
    deleted_at: null,
    source_name: 'Jornal do Brasil',
    source_type: 'newspaper',
    source_language: 'pt-BR',
  };

  beforeEach(() => {
    const editionsRepository: IEditionsRepository = {
      create: mock(),
      findById: mock(),
      update: mock(),
      softDelete: mock(),
      list: mock(),
    };
    const sourcesRepository: ISourcesRepository = {
      create: mock(),
      findById: mock(),
      update: mock(),
      softDelete: mock(),
      list: mock(),
    };

    service = new EditionsService(editionsRepository, sourcesRepository);

    // Mock service methods to isolate controller
    service.createEdition = mock();
    service.getEditionById = mock();
    service.updateEdition = mock();
    service.deleteEdition = mock();
    service.listEditions = mock();

    controller = new EditionsController(service);

    req = { body: {}, params: {}, query: {} };
    res = {
      status: mock().mockReturnThis(),
      json: mock().mockReturnThis(),
      send: mock().mockReturnThis(),
    };
    next = mock();
  });

  describe('create', () => {
    test('should return 201 and edition on success', async () => {
      (service.createEdition as ReturnType<typeof mock>).mockResolvedValue(
        fakeEdition,
      );
      req.body = {
        sourceId: '00000000-0000-0000-0000-000000000001',
        number: '42',
      };

      await controller.create(req as Request, res as Response, next);

      expect(service.createEdition).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(fakeEdition);
      expect(next).not.toHaveBeenCalled();
    });

    test('should call next with error on failure', async () => {
      const error = new Error('Test Error');
      (service.createEdition as ReturnType<typeof mock>).mockRejectedValue(
        error,
      );
      req.body = {};

      await controller.create(req as Request, res as Response, next);
      await new Promise(process.nextTick);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    test('should return 200 and EditionWithSource if found', async () => {
      (service.getEditionById as ReturnType<typeof mock>).mockResolvedValue(
        fakeEdition,
      );
      req.params = { id: '123' };

      await controller.getById(req as Request, res as Response, next);

      expect(service.getEditionById).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(fakeEdition);
    });
  });

  describe('update', () => {
    test('should return 200 and updated edition', async () => {
      const updated = { ...fakeEdition, number: '43' };
      (service.updateEdition as ReturnType<typeof mock>).mockResolvedValue(
        updated,
      );
      req.params = { id: '123' };
      req.body = { number: '43' };

      await controller.update(req as Request, res as Response, next);

      expect(service.updateEdition).toHaveBeenCalledWith('123', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updated);
    });
  });

  describe('delete', () => {
    test('should return 204 on success', async () => {
      (service.deleteEdition as ReturnType<typeof mock>).mockResolvedValue(
        undefined,
      );
      req.params = { id: '123' };

      await controller.delete(req as Request, res as Response, next);

      expect(service.deleteEdition).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    test('should return 200 and paginated list', async () => {
      const mockResult = {
        metadata: { total: 0, page: 1, limit: 10 },
        data: [],
      };
      (service.listEditions as ReturnType<typeof mock>).mockResolvedValue(
        mockResult,
      );

      req.filters = { source_type: { eq: 'newspaper' } };
      req.order = { published_at: 'desc' };
      req.pagination = { page: 1, limit: 10, offset: 0 };

      await controller.list(req as Request, res as Response, next);

      expect(service.listEditions).toHaveBeenCalledWith(
        req.filters,
        req.order,
        req.pagination,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });
});
