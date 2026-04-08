import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { HumctlError } from '../errors/HumctlError';

export interface IDeploymentRepository {
  getLatestRaw(
    organizationId: string,
    applicationId: string,
    environmentId: string,
    deployId: string
  ): Promise<unknown>;
}

export class DeploymentRepository implements IDeploymentRepository {
  constructor(private humctl: IHumctlAdapter) {}

  async getLatestRaw(
    organizationId: string,
    applicationId: string,
    environmentId: string,
    deployId: string
  ): Promise<unknown> {
    const deploymentUrl = `/orgs/${organizationId}/apps/${applicationId}/envs/${environmentId}/deploys/${deployId}`;
    const result = await this.humctl.execute(['api', 'get', deploymentUrl]);
    if (result.stderr !== '') {
      throw new HumctlError(
        'humctl api get ' + deploymentUrl,
        result.stderr,
        result.exitcode
      );
    }
    return JSON.parse(result.stdout);
  }
}
