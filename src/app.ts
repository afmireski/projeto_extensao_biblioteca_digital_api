import express from 'express';
import { container } from './container';
import { errorMiddleware } from './shared/middleware/error.middleware';
import { makeAuthRouter } from './modules/auth/auth.router';
import { makeUsersRouter } from './modules/users/users.router';

export const app = express();

app.use(express.json());

app.use('/api/auth', makeAuthRouter(container.resolve('authController')));
app.use(
  '/api/users',
  makeUsersRouter(
    container.resolve('userController'),
    container.resolve('authMiddleware'),
  ),
);

// Error handling middleware MUST be the last middleware
app.use(errorMiddleware);
