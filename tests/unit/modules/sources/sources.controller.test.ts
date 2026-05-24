import { expect, test, describe, mock, beforeEach } from 'bun:test';
import type { Request, Response, NextFunction } from 'express';
import { SourcesController } from '../../../../src/modules/sources/sources.controller';
import { SourcesService } from '../../../../src/modules/sources/sources.service';
import type { ISourcesRepository } from '../../../../src/modules/sources/sources.repository.port';
import type { Source } from '../../../../src/modules/sources/sources.types';

describe('SourcesController', () => {
  let controller: SourcesController;
  let service: SourcesService;
  let repository: ISourcesRepository;

  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    repository = {
      create: mock(),
      findById: mock(),
      update: mock(),
      softDelete: mock(),
      list: mock(),
    };
    service = new SourcesService(repository);

    // Mock service methods instead of repository to isolate controller
    service.createSource = mock();
    service.getSourceById = mock();
    service.updateSource = mock();
    service.deleteSource = mock();
    service.listSources = mock();

    controller = new SourcesController(service);

    req = {
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: mock().mockReturnThis(),
      json: mock().mockReturnThis(),
      send: mock().mockReturnThis(),
    };
    next = mock();
  });

  describe('create', () => {
    test('should return 201 and source on success', async () => {
      const newSource = { id: '123', name: 'Test' } as unknown as Source;
      (service.createSource as ReturnType<typeof mock>).mockResolvedValue(
        newSource,
      );
      req.body = { name: 'Test' };

      await controller.create(req as Request, res as Response, next);

      expect(service.createSource).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newSource);
      expect(next).not.toHaveBeenCalled();
    });

    test('should call next with error on failure', async () => {
      const error = new Error('Test Error');
      (service.createSource as ReturnType<typeof mock>).mockRejectedValue(
        error,
      );
      req.body = { name: 'Test' };

      await controller.create(req as Request, res as Response, next);
      await new Promise(process.nextTick);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    test('should return 200 and source if found', async () => {
      const existingSource = { id: '123', name: 'Test' } as unknown as Source;
      (service.getSourceById as ReturnType<typeof mock>).mockResolvedValue(
        existingSource,
      );
      req.params = { id: '123' };

      await controller.getById(req as Request, res as Response, next);

      expect(service.getSourceById).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(existingSource);
    });
  });

  describe('update', () => {
    test('should return 200 and updated source', async () => {
      const updatedSource = { id: '123', name: 'Updated' } as unknown as Source;
      (service.updateSource as ReturnType<typeof mock>).mockResolvedValue(
        updatedSource,
      );
      req.params = { id: '123' };
      req.body = { name: 'Updated' };

      await controller.update(req as Request, res as Response, next);

      expect(service.updateSource).toHaveBeenCalledWith('123', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedSource);
    });
  });

  describe('delete', () => {
    test('should return 204 on success', async () => {
      (service.deleteSource as ReturnType<typeof mock>).mockResolvedValue(
        undefined,
      );
      req.params = { id: '123' };

      await controller.delete(req as Request, res as Response, next);

      expect(service.deleteSource).toHaveBeenCalledWith('123');
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
      (service.listSources as ReturnType<typeof mock>).mockResolvedValue(
        mockResult,
      );

      req.filters = { type: { eq: 'book' } };
      req.order = { name: 'asc' };
      req.pagination = { page: 1, limit: 10, offset: 0 };

      await controller.list(req as Request, res as Response, next);

      expect(service.listSources).toHaveBeenCalledWith(
        req.filters,
        req.order,
        req.pagination,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });
});
