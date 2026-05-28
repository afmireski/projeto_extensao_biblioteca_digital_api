import { SignJWT, jwtVerify } from 'jose';
import type { IJwtService, JwtPayload } from './jwt.service.port';
import { UnauthorizedError } from '../errors/app-errors';

/**
 * Concrete implementation of the JWT service using the 'jose' library.
 * Reads configurations from environment variables like JWT_SECRET and JWT_EXPIRY_DAYS.
 */
export class JwtService implements IJwtService {
  private readonly secret: Uint8Array;
  private readonly expiryDays: number;

  /**
   * Initializes the JwtService.
   * Encodes the secret key and loads the token expiration configuration.
   * @throws {Error} If JWT_SECRET is not defined.
   */
  constructor() {
    const secretStr = process.env.JWT_SECRET;
    if (!secretStr) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }
    this.secret = new TextEncoder().encode(secretStr);

    const expiryStr = process.env.JWT_EXPIRY_DAYS;
    this.expiryDays = expiryStr ? parseInt(expiryStr, 10) : 7;
  }

  /**
   * Signs a payload and returns a signed JSON Web Token string.
   * @param payload - Session context details to embed in the token.
   * @returns A promise resolving to the JWT string.
   */
  public sign(payload: JwtPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${this.expiryDays}d`)
      .sign(this.secret);
  }

  /**
   * Verifies a JWT signature and retrieves its payload.
   * @param token - The raw JWT string to verify.
   * @returns A promise resolving to the decoded JwtPayload.
   * @throws {UnauthorizedError} If signature is invalid or expired.
   */
  public verify(token: string): Promise<JwtPayload> {
    return jwtVerify(token, this.secret)
      .then((result) => {
        return result.payload as unknown as JwtPayload;
      })
      .catch((err) => {
        throw new UnauthorizedError('Invalid or expired token', err);
      });
  }
}
