import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';

export interface IScoreInitializationService {
  generateInitFile(): Promise<string>;
}

export class ScoreInitializationService implements IScoreInitializationService {
  constructor(private humctl: IHumctlAdapter) {}

  async generateInitFile(): Promise<string> {
    const result = await this.humctl.execute(['score', 'init']);
    return result.stdout;
  }
}
