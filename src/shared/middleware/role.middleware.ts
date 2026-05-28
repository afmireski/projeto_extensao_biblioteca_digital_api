import type { RequestHandler } from 'express';
import type { UserRole } from '../../infra/database/types';
import { ForbiddenError } from '../errors/app-errors';

/**
 * Middleware factory for role-based authorization (RBAC).
 * Ensures that the authenticated user has one of the required roles.
 * Throws ForbiddenError if the user is unauthenticated or has insufficient permissions.
 * @param roles - The list of permitted roles.
 */
export const requireRoles = (roles: UserRole[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};
