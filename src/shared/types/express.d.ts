import type { UserRole } from '../../infra/database/types';
import type { PaginationParams, OrderParams, Filters } from './query';

declare global {
  namespace Express {
    /**
     * Extension of the Express Request interface to include custom application properties
     * attached by middleware such as authentication and query parsers.
     */
    interface Request {
      /**
       * Authenticated user session information populated by the auth middleware.
       */
      user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        sessionId: string;
      };
      /**
       * Validated pagination parameters (limit, page, offset) populated by the parsePagination middleware.
       */
      pagination?: PaginationParams;
      /**
       * Validated sorting criteria populated by the parseOrder middleware.
       */
      order?: OrderParams;
      /**
       * Validated filter criteria populated by the parseFilter middleware.
       */
      filters?: Filters;
    }
  }
}
