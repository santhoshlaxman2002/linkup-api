import jwt, { SignOptions, VerifyOptions, JwtPayload } from 'jsonwebtoken';

export class JwtUtils {
  private static getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }
    return secret;
  }

  static sign<T extends object>(payload: T, options: SignOptions = {}): string {
    const secret = this.getSecret();
    return jwt.sign(payload, secret, { ...options, expiresIn: "1d" });
  }

  static verify<T extends object = JwtPayload>(token: string, options: VerifyOptions = {}): T {
    const secret = this.getSecret();
    return jwt.verify(token, secret, options) as T;
  }

  static decode(token: string): null | string | JwtPayload {
    return jwt.decode(token);
  }
}
