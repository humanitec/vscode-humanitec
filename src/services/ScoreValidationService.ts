import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';

export interface IScoreValidationService {
  validate(filepath: string): Promise<ValidationError[]>;
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

export class ScoreValidationService implements IScoreValidationService {
  constructor(private humctl: IHumctlAdapter) {}

  async validate(filepath: string): Promise<ValidationError[]> {
    const result = await this.humctl.execute(['score', 'validate', filepath]);

    const validationErrors: ValidationError[] = [];
    // TODO: Make the handling better
    if (result.stdout === '"The Score file validated successfully"\n') {
      return validationErrors;
    }
    const validationRawErrors = JSON.parse(result.stdout);
    validationRawErrors.forEach((validationRawError: any) => {
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
