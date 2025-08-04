import {injectable, BindingScope} from '@loopback/core';
import {genSalt, hash, compare} from 'bcryptjs';

export interface PasswordHasher<T = string> {
  hashPassword(password: T): Promise<T>;
  comparePassword(providedPass: T, storedPass: T): Promise<boolean>;
}

@injectable({scope: BindingScope.TRANSIENT})
export class HashPasswordService implements PasswordHasher {
  async hashPassword(password: string): Promise<string> {
    const salt = await genSalt();
    return hash(password, salt);
  }

  async comparePassword(
    providedPass: string,
    storedPass: string,
  ): Promise<boolean> {
    return compare(providedPass, storedPass);
  }
}
