import { IHumanitecExtensionError } from './IHumanitecExtensionError';

export class NotFoundError implements IHumanitecExtensionError {
  message(): string {
    return 'Resource not found';
  }

  details(): string {
    return this.message();
  }
}
