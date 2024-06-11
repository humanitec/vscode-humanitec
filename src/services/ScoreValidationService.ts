import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';

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
    command.push(filepath);

    const result = await this.humctl.execute(command);

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
