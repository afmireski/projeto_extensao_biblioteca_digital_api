import { Router } from 'express';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { AuthController } from './auth.controller';
import { loginSchema } from './auth.schemas';

export const makeAuthRouter = (authController: AuthController): Router => {
  const router = Router();

  router.post('/login', validateBody(loginSchema), authController.login);

  return router;
};
