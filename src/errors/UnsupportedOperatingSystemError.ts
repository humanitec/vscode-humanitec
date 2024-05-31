import { IHumanitecExtensionError } from './IHumanitecExtensionError';

export class UnsupportedOperatingSystemError
  implements IHumanitecExtensionError
{
  constructor(
    private os: string,
    private arch: string
  ) {}

  message(): string {
    return `Identified operating system: ${this.os}-${this.arch} is not supported`;
  }

  details(): string {
    return this.message();
  }
}
