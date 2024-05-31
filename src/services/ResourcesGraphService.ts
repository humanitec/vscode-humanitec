import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';

export interface IResourceDependencyGraphService {
  generate(): Promise<string>;
}

export class ResourcesGraphService implements IResourceDependencyGraphService {
  constructor(private humctl: IHumctlAdapter) {}

  async generate(): Promise<string> {
    const result = await this.humctl.execute(['resources', 'graph']);
    if (result.stdout === '') {
      throw result.stderr;
    }
    return result.stdout;
  }
}
