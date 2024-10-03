import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { HumctlError } from '../errors/HumctlError';

export interface IResourceDependencyGraphService {
  generate(): Promise<string>;
}

export class ResourcesGraphService implements IResourceDependencyGraphService {
  constructor(private humctl: IHumctlAdapter) {}

  async generate(): Promise<string> {
    const result = await this.humctl.execute(['resources', 'graph']);
    if (result.stderr !== '') {
      throw new HumctlError(
        'humctl resources graph',
        result.stderr,
        result.exitcode
      );
    }
    return result.stdout;
  }
}
