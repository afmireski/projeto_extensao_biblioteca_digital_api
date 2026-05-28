import { Router } from 'express';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { AuthController } from './auth.controller';
import { loginSchema } from './auth.schemas';

/**
 * Factory function to create and configure the Express router for authentication.
 * Defines the public endpoints like login.
 * @param authController - The controller instance to handle request routing.
 * @returns Configured Express Router.
 */
export const makeAuthRouter = (authController: AuthController): Router => {
  const router = Router();

  router.post('/login', validateBody(loginSchema), authController.login);

  return router;
};
