import type { Request, Response, NextFunction } from 'express';
import { UserService } from './users.service';

export class UserController {
  constructor(private readonly userService: UserService) {
    this.signup = this.signup.bind(this);
    this.profile = this.profile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.deleteAccount = this.deleteAccount.bind(this);
    this.signout = this.signout.bind(this);
  }

  public signup(req: Request, res: Response, next: NextFunction): void {
    this.userService
      .signup(req.body)
      .then((output) => {
        res.status(201).json(output);
      })
      .catch(next);
  }

  public profile(req: Request, res: Response, next: NextFunction): void {
    this.userService
      .getProfile(req.user!.id)
      .then((output) => {
        res.status(200).json(output);
      })
      .catch(next);
  }

  public updateProfile(req: Request, res: Response, next: NextFunction): void {
    this.userService
      .updateProfile(req.user!.id, req.body)
      .then(() => {
        res.status(200).json({ success: true });
      })
      .catch(next);
  }

  public updatePassword(req: Request, res: Response, next: NextFunction): void {
    this.userService
      .updatePassword(req.user!.id, req.body)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  }

  public deleteAccount(req: Request, res: Response, next: NextFunction): void {
    this.userService
      .deleteAccount(req.user!.id)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  }

  public signout(req: Request, res: Response, next: NextFunction): void {
    this.userService
      .signout(req.user!.sessionId)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  }
}
