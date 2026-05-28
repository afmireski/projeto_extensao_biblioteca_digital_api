import type { Request, Response, NextFunction } from 'express';
import { UserService } from './users.service';

/**
 * Controller handling user-related HTTP endpoints.
 * Maps HTTP requests to the UserService.
 */
export class UserController {
  constructor(private readonly userService: UserService) {
    this.signup = this.signup.bind(this);
    this.profile = this.profile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.deleteAccount = this.deleteAccount.bind(this);
    this.signout = this.signout.bind(this);
  }

  /**
   * Handles POST /api/users/signup requests to register a new user.
   * @param req - Express request with user signup body.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  public signup(req: Request, res: Response, next: NextFunction): void {
    this.userService
      .signup(req.body)
      .then((output) => {
        res.status(201).json(output);
      })
      .catch(next);
  }

  /**
   * Handles GET /api/users/profile requests to fetch the authenticated user's profile.
   * @param req - Express request with decoded user info.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  public profile(req: Request, res: Response, next: NextFunction): void {
    this.userService
      .getProfile(req.user!.id)
      .then((output) => {
        res.status(200).json(output);
      })
      .catch(next);
  }

  /**
   * Handles PATCH /api/users/update-profile requests to update profile info.
   * @param req - Express request with partial profile updates.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  public updateProfile(req: Request, res: Response, next: NextFunction): void {
    this.userService
      .updateProfile(req.user!.id, req.body)
      .then(() => {
        res.status(200).json({ success: true });
      })
      .catch(next);
  }

  /**
   * Handles POST /api/users/update-password requests to change user password.
   * @param req - Express request with password change data.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  public updatePassword(req: Request, res: Response, next: NextFunction): void {
    this.userService
      .updatePassword(req.user!.id, req.body)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  }

  /**
   * Handles DELETE /api/users/delete-account requests to soft-delete user account.
   * @param req - Express request containing current user session.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  public deleteAccount(req: Request, res: Response, next: NextFunction): void {
    this.userService
      .deleteAccount(req.user!.id)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  }

  /**
   * Handles POST /api/users/signout requests to invalidate current user session.
   * @param req - Express request containing session to revoke.
   * @param res - Express response helper.
   * @param next - Express next middleware callback.
   */
  public signout(req: Request, res: Response, next: NextFunction): void {
    this.userService
      .signout(req.user!.sessionId)
      .then(() => {
        res.status(204).send();
      })
      .catch(next);
  }
}
