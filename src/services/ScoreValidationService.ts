import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { HumctlError } from '../errors/HumctlError';

export interface IScoreValidationService {
  validate(filepath: string, onlyLocal: boolean): Promise<ValidationError[]>;
}

export class ValidationError {
  readonly level: string;
  readonly location: string;
  readonly message: string;

  constructor(level: string, location: string, message: string) {
    this.level = level;
    this.location = location;
    this.message = message;
  }
}

interface RawValidationError {
  Level: string;
  Location: string;
  Message: string;
}

export class ScoreValidationService implements IScoreValidationService {
  constructor(private humctl: IHumctlAdapter) {}

  async validate(
    filepath: string,
    onlyLocal: boolean
  ): Promise<ValidationError[]> {
    const command = ['score', 'validate'];
    if (onlyLocal) {
      command.push('--local');
    }

    // Windows vscode for some reason adds a "/" in front of the path even though it's windows path which causes humctl to fail
    const os = process.platform.toString();
    if (os === 'win32') {
      if (filepath.startsWith('/')) {
        filepath = filepath.substring(1);
      }
    }
    command.push(filepath);

    const result = await this.humctl.execute(command);
    if (result.stdout === '') {
      throw new HumctlError(
        'humctl ' + command.join(' '),
        result.stderr,
        result.exitcode
      );
    }

    const validationErrors: ValidationError[] = [];
    // TODO: Make the handling better
    if (result.stdout === '"The Score file validated successfully"\n') {
      return validationErrors;
    }
    const validationRawErrors = JSON.parse(result.stdout);
    validationRawErrors.forEach((validationRawError: RawValidationError) => {
      validationErrors.push(
        new ValidationError(
          validationRawError.Level,
          validationRawError.Location,
          validationRawError.Message
        )
      );
    });

    return validationErrors;
  }
}
