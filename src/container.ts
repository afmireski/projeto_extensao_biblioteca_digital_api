import { createContainer, asClass, asValue, InjectionMode } from 'awilix';
import { db } from './infra/database/client';

// Repositories
import { AuthRepository } from './modules/auth/auth.repository';
import { UserRepository } from './modules/users/users.repository';
import { SourcesRepository } from './modules/sources/sources.repository';

// Services
import { JwtService } from './shared/services/jwt.service';
import { AuthService } from './modules/auth/auth.service';
import { UserService } from './modules/users/users.service';
import { SourcesService } from './modules/sources/sources.service';

// Controllers
import { AuthController } from './modules/auth/auth.controller';
import { UserController } from './modules/users/users.controller';
import { SourcesController } from './modules/sources/sources.controller';

// Middlewares
import { makeAuthMiddleware } from './shared/middleware/auth.middleware';

export const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  // Infrastructure
  db: asValue(db),

  // Repositories
  authRepository: asClass(AuthRepository).singleton(),
  userRepository: asClass(UserRepository).singleton(),
  sourcesRepository: asClass(SourcesRepository).singleton(),

  // Services
  jwtService: asClass(JwtService).singleton(),
  authService: asClass(AuthService).singleton(),
  userService: asClass(UserService).singleton(),
  sourcesService: asClass(SourcesService).singleton(),

  // Controllers
  authController: asClass(AuthController).singleton(),
  userController: asClass(UserController).singleton(),
  sourcesController: asClass(SourcesController).singleton(),
});

container.register({
  authMiddleware: asValue(
    makeAuthMiddleware(
      container.resolve('jwtService'),
      container.resolve('userRepository'),
    ),
  ),
});
