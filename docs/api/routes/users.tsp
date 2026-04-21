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
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 409;
    @body body: ErrorResponse;
  };

  /**
   * Returns the profile of the authenticated user.
   * Requires a valid Bearer token.
   */
  @get
  @route("/profile")
  profile(
    @header authorization: string,
  ): {
    @statusCode statusCode: 200;
    @body body: UserProfile;
  } | {
    @statusCode statusCode: 401;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 404;
    @body body: ErrorResponse;
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
    @header authorization: string,
    @body body: {
      name?: string;
      email?: string;
    },
  ): {
    @statusCode statusCode: 200;
    @body body: { success: boolean };
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 401;
    @body body: ErrorResponse;
  };

  /**
   * Changes the authenticated user's password.
   * Revokes all active sessions on success, requiring re-authentication.
   * Requires a valid Bearer token.
   */
  @post
  @route("/update-password")
  updatePassword(
    @header authorization: string,
    @body body: {
      /** Current password. */
      oldPassword: string;
      /** New password (min 8 characters). */
      password: string;
      /** Must match `password`. */
      confirmPassword: string;
    },
  ): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 401;
    @body body: ErrorResponse;
  };

  /**
   * Soft-deletes the authenticated user's account and revokes all sessions.
   * Always returns 204, even if the account was already deleted.
   * Requires a valid Bearer token.
   */
  @delete
  @route("/delete-account")
  deleteAccount(
    @header authorization: string,
  ): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 401;
    @body body: ErrorResponse;
  };

  /**
   * Revokes the current session (signs out from the current device).
   * Requires a valid Bearer token.
   */
  @post
  @route("/signout")
  signout(
    @header authorization: string,
  ): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 401;
    @body body: ErrorResponse;
  };
}
