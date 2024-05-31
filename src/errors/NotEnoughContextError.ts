import { HumanitecContext } from '../domain/HumanitecContext';
import { IHumanitecExtensionError } from './IHumanitecExtensionError';

export class NotEnoughContextError implements IHumanitecExtensionError {
  constructor(private requiredContext: HumanitecContext) {}

  message(): string {
    return (
      'There is no enough context to process the request. Required context is: ' +
      this.requiredContext
    );
  }

  details(): string {
    return this.message();
  }
}
