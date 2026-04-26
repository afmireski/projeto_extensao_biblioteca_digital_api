import type { UserRole } from '../../infra/database/types';

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
    }
  }
}
