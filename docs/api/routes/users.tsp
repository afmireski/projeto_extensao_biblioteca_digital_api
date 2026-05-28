using TypeSpec.Http;

namespace BibliotecaDigital;

/** Users endpoints — account lifecycle. */
@route("/api/users")
@tag("users")
interface Users {
  /**
   * Registers a new user account with role `reader`.
   * Returns the email of the created user.
   */
  @useAuth(NoAuth)
  @post
  @route("/signup")
  signup(
    @body body: {
      name: string;
      email: string;
      /** Min 8 characters. */
      password: string;
    },
  ): {
    @statusCode statusCode: 201;
    @body body: { email: string };
  } | {
    @statusCode statusCode: 400;
    @body body: ValidationErrorResponse;
  } | {
    @statusCode statusCode: 409;
    @body body: ConflictErrorResponse;
  };

  /**
   * Returns the profile of the authenticated user.
   * Requires a valid Bearer token.
   */
  @get
  @route("/profile")
  profile(): {
    @statusCode statusCode: 200;
    @body body: UserProfile;
  } | {
    @statusCode statusCode: 401;
    @body body: UnauthorizedErrorResponse;
  } | {
    @statusCode statusCode: 404;
    @body body: NotFoundErrorResponse;
  };

  /**
   * Updates the authenticated user's name and/or email.
   * If the new email conflicts with an existing account, the response is
   * still 200 (masked conflict to prevent user enumeration).
   * Requires a valid Bearer token.
   */
  @patch
  @route("/update-profile")
  updateProfile(
    @body body: {
      name?: string;
      email?: string;
    },
  ): {
    @statusCode statusCode: 200;
    @body body: { success: boolean };
  } | {
    @statusCode statusCode: 400;
    @body body: ValidationErrorResponse;
  } | {
    @statusCode statusCode: 401;
    @body body: UnauthorizedErrorResponse;
  };

  /**
   * Changes the authenticated user's password.
   * Revokes all active sessions on success, requiring re-authentication.
   * Requires a valid Bearer token.
   */
  @post
  @route("/update-password")
  updatePassword(
    @body body: {
      /** Current password. */
      old_password: string;
      /** New password (min 8 characters). */
      password: string;
      /** Must match `password`. */
      confirm_password: string;
    },
  ): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 400;
    @body body: ValidationErrorResponse;
  } | {
    @statusCode statusCode: 401;
    @body body: UnauthorizedErrorResponse;
  };

  /**
   * Soft-deletes the authenticated user's account and revokes all sessions.
   * Always returns 204, even if the account was already deleted.
   * Requires a valid Bearer token.
   */
  @delete
  @route("/delete-account")
  deleteAccount(): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 401;
    @body body: UnauthorizedErrorResponse;
  };

  /**
   * Revokes the current session (signs out from the current device).
   * Requires a valid Bearer token.
   */
  @post
  @route("/signout")
  signout(): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 401;
    @body body: UnauthorizedErrorResponse;
  };
}
