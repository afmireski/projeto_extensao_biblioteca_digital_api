import { Router } from 'express';
import type { RequestHandler } from 'express';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { UserController } from './users.controller';
import {
  signupSchema,
  updateProfileSchema,
  updatePasswordSchema,
} from './users.schemas';

/**
 * Factory function to create and configure the Express router for user operations.
 * Defines endpoints for registration, profile retrieval/update, password change, account deletion, and signout.
 * @param userController - Controller handling user HTTP request dispatching.
 * @param authMiddleware - Middleware handling session validation.
 * @returns Configured Express Router.
 */
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
