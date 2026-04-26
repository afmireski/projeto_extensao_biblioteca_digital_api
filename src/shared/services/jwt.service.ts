import { SignJWT, jwtVerify } from 'jose';
import type { IJwtService, JwtPayload } from './jwt.service.port';
import { UnauthorizedError } from '../errors/app-errors';

export class JwtService implements IJwtService {
  private readonly secret: Uint8Array;
  private readonly expiryDays: number;

  constructor() {
    const secretStr = process.env.JWT_SECRET;
    if (!secretStr) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }
    this.secret = new TextEncoder().encode(secretStr);

    const expiryStr = process.env.JWT_EXPIRY_DAYS;
    this.expiryDays = expiryStr ? parseInt(expiryStr, 10) : 7;
  }

  public sign(payload: JwtPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${this.expiryDays}d`)
      .sign(this.secret);
  }

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
