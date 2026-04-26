import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  constructor(private readonly authService: AuthService) {
    this.login = this.login.bind(this);
  }

  public login(req: Request, res: Response, next: NextFunction): void {
    this.authService
      .login(req.body)
      .then((output) => {
        res.status(200).json(output);
      })
      .catch(next);
  }
}
