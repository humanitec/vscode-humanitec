import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { HumctlError } from '../errors/HumctlError';

export interface IScoreInitializationService {
  generateInitFile(): Promise<string>;
}

export class ScoreInitializationService implements IScoreInitializationService {
  constructor(private humctl: IHumctlAdapter) {}

  async generateInitFile(): Promise<string> {
    const result = await this.humctl.execute(['score', 'init']);
    if (result.stderr !== '') {
      throw new HumctlError(
        'humctl score init',
        result.stderr,
        result.exitcode
      );
    }
    return result.stdout;
  }
}
