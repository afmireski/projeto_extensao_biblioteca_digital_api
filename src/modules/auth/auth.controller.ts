import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

/**
 * Controller handling authentication-related HTTP endpoints.
 * Maps HTTP requests to the AuthService and handles the response.
 */
export class AuthController {
  constructor(private readonly authService: AuthService) {
    this.login = this.login.bind(this);
  }

  /**
   * Handles POST /api/auth/login requests.
   * Validates user credentials and returns a session token.
   * @param req - Express request containing login payload.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  public login(req: Request, res: Response, next: NextFunction): void {
    this.authService
      .login(req.body)
      .then((output) => {
        res.status(200).json(output);
      })
      .catch(next);
  }
}
