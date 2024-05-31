import { IHumanitecExtensionError } from './IHumanitecExtensionError';

export class ControllerIsAlreadyRegisteredError
  implements IHumanitecExtensionError
{
  constructor(private controllerName: string) {}

  message(): string {
    return `Controller ${this.controllerName} already registered. Please contact the extension developer`;
  }

  details(): string {
    return this.message();
  }
}
