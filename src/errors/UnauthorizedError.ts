import { IHumanitecExtensionError } from './IHumanitecExtensionError';

export class UnauthorizedError implements IHumanitecExtensionError {
  message(): string {
    return 'Invalid or empty Humanitec token. Login to Humanitec using "Humanitec: Login" or set your token using "Humanitec: Set token" command.';
  }

  details(): string {
    return this.message();
  }
}
