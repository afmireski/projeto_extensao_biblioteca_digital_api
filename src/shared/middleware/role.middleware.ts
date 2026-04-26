import type { RequestHandler } from 'express';
import type { UserRole } from '../../infra/database/types';
import { ForbiddenError } from '../errors/app-errors';

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
