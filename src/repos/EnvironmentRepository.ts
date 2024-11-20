import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { Environment } from '../domain/Environment';
import { HumctlError } from '../errors/HumctlError';

export interface IEnvironmentRepository {
  getFrom(
    organizationId: string,
    applicationId: string
  ): Promise<Environment[]>;
  get(
    organizationId: string,
    applicationId: string,
    environmentId: string
  ): Promise<Environment>;
}

interface RawEnvironment {
  metadata: {
    id: string;
  };
  entity: {
    name: string;
    from_deploy: string | null;
  };
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
    if (result.stderr !== '') {
      throw new HumctlError(
        'humctl --org ' +
          organizationId +
          ' --app ' +
          applicationId +
          ' get envs',
        result.stderr,
        result.exitcode
      );
    }

    const environments: Environment[] = [];

    const rawEnvironments = JSON.parse(result.stdout);
    rawEnvironments.forEach((rawEnvironment: RawEnvironment) => {
      const environment = new Environment(
        rawEnvironment['metadata']['id'],
        rawEnvironment['entity']['name'],
        organizationId,
        applicationId,
        rawEnvironment.entity.from_deploy
      );
      environments.push(environment);
    });

    return environments;
  }

  async get(
    organizationId: string,
    applicationId: string,
    environmentId: string
  ): Promise<Environment> {
    const result = await this.humctl.execute([
      '--org',
      organizationId,
      '--app',
      applicationId,
      'get',
      'envs',
      environmentId,
    ]);
    if (result.stderr !== '') {
      throw new HumctlError(
        'humctl --org ' +
          organizationId +
          ' --app ' +
          applicationId +
          ' get envs',
        result.stderr,
        result.exitcode
      );
    }

    const rawEnvironment = JSON.parse(result.stdout) as RawEnvironment;
    return new Environment(
      rawEnvironment['metadata']['id'],
      rawEnvironment['entity']['name'],
      organizationId,
      applicationId,
      rawEnvironment.entity.from_deploy
    );
  }
}
