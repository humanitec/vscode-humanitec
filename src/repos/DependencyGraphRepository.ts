import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { HumctlError } from '../errors/HumctlError';

export interface IDependencyGraphRepository {
  getRaw(
    organizationId: string,
    applicationId: string,
    environmentId: string,
    dependencyGraphId: string
  ): Promise<unknown>;
}

export class DependencyGraphRepository implements IDependencyGraphRepository {
  constructor(private humctl: IHumctlAdapter) {}
  async getRaw(
    organizationId: string,
    applicationId: string,
    environmentId: string,
    dependencyGraphId: string
  ): Promise<unknown> {
    const graphUrl = `/orgs/${organizationId}/apps/${applicationId}/envs/${environmentId}/resources/graphs/${dependencyGraphId}`;
    const result = await this.humctl.execute(['api', 'get', graphUrl]);
    if (result.stderr !== '') {
      throw new HumctlError(
        'humctl api get ' + graphUrl,
        result.stderr,
        result.exitcode
      );
    }
    return JSON.parse(result.stdout);
  }
}
