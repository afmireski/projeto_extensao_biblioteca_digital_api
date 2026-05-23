import { createContainer, asClass, asValue, InjectionMode } from 'awilix';
import { db } from './infra/database/client';
import { S3StorageAdapter } from './infra/storage/s3.adapter';
import { RabbitMQService } from './infra/queue/rabbitmq.service';
import { MockOcrClient } from './infra/ocr/mock-ocr-client';
import { OcrRepository } from './modules/ocr/ocr.repository';
import { OcrService } from './modules/ocr/ocr.service';
import { OcrFacade } from './modules/ocr/ocr.facade';
import { OcrConsumer } from './modules/ocr/ocr.consumer';

const storageAdapter = process.env.STORAGE_ENDPOINT
  ? new S3StorageAdapter()
  : new S3StorageAdapter(); // using s3 always for now since minio is s3 compatible

// Repositories
import { AuthRepository } from './modules/auth/auth.repository';
import { UserRepository } from './modules/users/users.repository';
import { SourcesRepository } from './modules/sources/sources.repository';
import { EditionsRepository } from './modules/editions/editions.repository';

import { PagesRepository } from './modules/pages/pages.repository';

// Services
import { JwtService } from './shared/services/jwt.service';
import { AuthService } from './modules/auth/auth.service';
import { UserService } from './modules/users/users.service';
import { SourcesService } from './modules/sources/sources.service';
import { EditionsService } from './modules/editions/editions.service';
import { PagesService } from './modules/pages/pages.service';

// Controllers
import { AuthController } from './modules/auth/auth.controller';
import { UserController } from './modules/users/users.controller';
import { SourcesController } from './modules/sources/sources.controller';
import { EditionsController } from './modules/editions/editions.controller';
import { PagesController } from './modules/pages/pages.controller';

// Middlewares
import { makeAuthMiddleware } from './shared/middleware/auth.middleware';

export const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  // Infrastructure
  db: asValue(db),
  storageAdapter: asValue(storageAdapter),
  queueService: asClass(RabbitMQService).singleton(),
  ocrClient: asClass(MockOcrClient).singleton(),

  // Repositories
  authRepository: asClass(AuthRepository).singleton(),
  userRepository: asClass(UserRepository).singleton(),
  sourcesRepository: asClass(SourcesRepository).singleton(),
  editionsRepository: asClass(EditionsRepository).singleton(),
  pagesRepository: asClass(PagesRepository).singleton(),
  ocrRepository: asClass(OcrRepository).singleton(),

  // Services
  jwtService: asClass(JwtService).singleton(),
  authService: asClass(AuthService).singleton(),
  userService: asClass(UserService).singleton(),
  sourcesService: asClass(SourcesService).singleton(),
  editionsService: asClass(EditionsService).singleton(),
  pagesService: asClass(PagesService).singleton(),
  ocrService: asClass(OcrService).singleton(),
  ocrFacade: asClass(OcrFacade).singleton(),
  ocrConsumer: asClass(OcrConsumer).singleton(),

  // Controllers
  authController: asClass(AuthController).singleton(),
  userController: asClass(UserController).singleton(),
  sourcesController: asClass(SourcesController).singleton(),
  editionsController: asClass(EditionsController).singleton(),
  pagesController: asClass(PagesController).singleton(),
});

container.register({
  authMiddleware: asValue(
    makeAuthMiddleware(
      container.resolve('jwtService'),
      container.resolve('userRepository'),
    ),
  ),
});
