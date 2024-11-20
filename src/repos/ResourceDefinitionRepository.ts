import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { HumctlError } from '../errors/HumctlError';

export interface IResourceDefinitionRepository {
  getAllRaw(organizationId: string): Promise<unknown>;
}

export class ResourceDefinitionRepository
  implements IResourceDefinitionRepository
{
  constructor(private humctl: IHumctlAdapter) {}
  async getAllRaw(organizationId: string): Promise<unknown> {
    const defUrl = `/orgs/${organizationId}/resources/defs`;
    const result = await this.humctl.execute(['api', 'get', defUrl]);
    if (result.stderr !== '') {
      throw new HumctlError(
        'humctl api get ' + defUrl,
        result.stderr,
        result.exitcode
      );
    }
    return JSON.parse(result.stdout);
  }
}
