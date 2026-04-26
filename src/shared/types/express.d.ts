import type { UserRole } from '../../infra/database/types';
import type { PaginationParams, OrderParams, Filters } from './query';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        sessionId: string;
      };
      pagination?: PaginationParams;
      order?: OrderParams;
      filters?: Filters;
    }
  }
}
