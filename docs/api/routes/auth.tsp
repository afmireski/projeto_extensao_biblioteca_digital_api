using TypeSpec.Http;

namespace BibliotecaDigital;

/** Auth endpoints — login only. Signup lives under /users. */
@route("/api/auth")
@tag("auth")
interface Auth {
  /**
   * Authenticates a user with email and password.
   * Returns a signed JWT along with the user's email and name.
   */
  @post
  @route("/login")
  login(
    @body body: {
      /** Registered user email. */
      email: string;
      /** User password (min 8 characters). */
      password: string;
    },
  ): {
    @statusCode statusCode: 200;
    @body body: LoginResponse;
  } | {
    @statusCode statusCode: 400;
    @body body: ErrorResponse;
  } | {
    @statusCode statusCode: 401;
    @body body: ErrorResponse;
  };
}
