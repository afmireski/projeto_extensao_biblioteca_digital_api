import { Router } from 'express';
import type { RequestHandler } from 'express';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { UserController } from './users.controller';
import {
  signupSchema,
  updateProfileSchema,
  updatePasswordSchema,
} from './users.schemas';

export const makeUsersRouter = (
  userController: UserController,
  authMiddleware: RequestHandler,
): Router => {
  const router = Router();

  router.post('/signup', validateBody(signupSchema), userController.signup);

  router.get('/profile', authMiddleware, userController.profile);

  router.patch(
    '/update-profile',
    authMiddleware,
    validateBody(updateProfileSchema),
    userController.updateProfile,
  );

  router.post(
    '/update-password',
    authMiddleware,
    validateBody(updatePasswordSchema),
    userController.updatePassword,
  );

  router.delete(
    '/delete-account',
    authMiddleware,
    userController.deleteAccount,
  );

  router.post('/signout', authMiddleware, userController.signout);

  return router;
};
