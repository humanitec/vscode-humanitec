import { IHumanitecExtensionError } from './IHumanitecExtensionError';

export class AuthorizationError implements IHumanitecExtensionError {
  constructor(private response: string | undefined) {}

  message(): string {
    return 'Authorization failed';
  }

  details(): string {
    return `${this.message()}: ${this.response}`;
  }
}
