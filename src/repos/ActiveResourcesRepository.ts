import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { HumctlError } from '../errors/HumctlError';

export interface IActiveResourcesRepository {
  getRaw(
    organizationId: string,
    applicationId: string,
    environmentId: string
  ): Promise<unknown>;
}

export class ActiveResourcesRepository implements IActiveResourcesRepository {
  constructor(private humctl: IHumctlAdapter) {}
  async getRaw(
    organizationId: string,
    applicationId: string,
    environmentId: string
  ): Promise<unknown> {
    const resourcesUrl = `/orgs/${organizationId}/apps/${applicationId}/envs/${environmentId}/resources`;
    const result = await this.humctl.execute(['api', 'get', resourcesUrl]);
    if (result.stderr !== '') {
      throw new HumctlError(
        'humctl api get ' + resourcesUrl,
        result.stderr,
        result.exitcode
      );
    }
    return JSON.parse(result.stdout);
  }
}
