import { IHumanitecExtensionError } from './IHumanitecExtensionError';

export class UnexpectedEmptyOutputError implements IHumanitecExtensionError {
  constructor(
    private binaryPath: string,
    private command: string[],
    private options: unknown
  ) {}

  message(): string {
    return `humctl didn't returned any output. Look at the 'Humanitec' output to get detailed info`;
  }

  details(): string {
    return `Command ${this.binaryPath} ${this.command.join(' ')} with following options: ${JSON.stringify(this.options)} didn't returned any output`;
  }
}
