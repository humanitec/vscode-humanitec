import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { Environment } from '../domain/Environment';

export interface IEnvironmentRepository {
  getFrom(
    organizationId: string,
    applicationId: string
  ): Promise<Environment[]>;
}

export class EnvironmentRepository implements IEnvironmentRepository {
  constructor(private humctl: IHumctlAdapter) {}

  async getFrom(
    organizationId: string,
    applicationId: string
  ): Promise<Environment[]> {
    const result = await this.humctl.execute([
      '--org',
      organizationId,
      '--app',
      applicationId,
      'get',
      'envs',
    ]);
    const environments: Environment[] = [];

    const rawEnvironments = JSON.parse(result.stdout);
    rawEnvironments.forEach((rawEnvironment: any) => {
      const environment = new Environment(
        rawEnvironment['metadata']['id'],
        rawEnvironment['entity']['name'],
        organizationId,
        applicationId
      );
      environments.push(environment);
    });

    return environments;
  }
}
