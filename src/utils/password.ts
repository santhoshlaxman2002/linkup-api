import bcrypt from 'bcryptjs';

export class PasswordUtils {
  static async hashPassword(plainPassword: string, saltRounds: number = 10): Promise<string> {
    return bcrypt.hash(plainPassword, saltRounds);
  }

  static async comparePassword(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}
