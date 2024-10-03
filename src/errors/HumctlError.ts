import { IHumanitecExtensionError } from './IHumanitecExtensionError';

export class HumctlError implements IHumanitecExtensionError {
  constructor(
    private readonly command: string,
    private readonly output: string,
    private readonly exitCode: number
  ) {}

  message(): string {
    return 'Command: ' + this.command + ' returned an unexpected error';
  }

  details(): string {
    return JSON.stringify({
      command: this.command,
      output: this.output,
      exitCode: this.exitCode,
    });
  }
}
