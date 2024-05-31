import { IHumanitecExtensionError } from './IHumanitecExtensionError';

export class AuthorizationDeclined implements IHumanitecExtensionError {
  message(): string {
    return 'Authorization declined by user';
  }

  details(): string {
    return this.message();
  }
}
