import express from 'express';
import { corsMiddleware } from './shared/middleware/cors.middleware';
import { container } from './container';
import { errorMiddleware } from './shared/middleware/error.middleware';
import { makeAuthRouter } from './modules/auth/auth.router';
import { makeUsersRouter } from './modules/users/users.router';
import { makeSourcesRouter } from './modules/sources/sources.router';
import { makeEditionsRouter } from './modules/editions/editions.router';
import { makePagesRouter } from './modules/pages/pages.router';
import { makeDocsRouter } from './modules/docs/docs.router';

export const app = express();

app.use(corsMiddleware());
app.use(express.json());

// Mount docs router if SWAGGER_TOKEN is configured
if (process.env.SWAGGER_TOKEN) {
  app.use('/docs', makeDocsRouter());
}

app.use('/api/auth', makeAuthRouter(container.resolve('authController')));
app.use(
  '/api/users',
  makeUsersRouter(
    container.resolve('userController'),
    container.resolve('authMiddleware'),
  ),
);
app.use(
  '/api/sources',
  makeSourcesRouter(
    container.resolve('sourcesController'),
    container.resolve('authMiddleware'),
  ),
);
app.use(
  '/api/editions',
  makeEditionsRouter(
    container.resolve('editionsController'),
    container.resolve('authMiddleware'),
  ),
);
app.use(
  '/api/pages',
  makePagesRouter(
    container.resolve('pagesController'),
    container.resolve('authMiddleware'),
  ),
);

// Error handling middleware MUST be the last middleware
app.use(errorMiddleware);
