import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { Application } from '../domain/Application';
import { HumctlError } from '../errors/HumctlError';

export interface IApplicationRepository {
  getFrom(organizationId: string): Promise<Application[]>;
}

interface RawApplication {
  metadata: {
    id: string;
  };
  entity: {
    name: string;
  };
}

export class ApplicationRepository implements IApplicationRepository {
  constructor(private humctl: IHumctlAdapter) {}

  async getFrom(organizationId: string): Promise<Application[]> {
    const result = await this.humctl.execute([
      '--org',
      organizationId,
      'get',
      'apps',
    ]);
    if (result.stderr !== '') {
      throw new HumctlError(
        'humctl --org ' + organizationId + ' get apps',
        result.stderr,
        result.exitcode
      );
    }

    const applications: Application[] = [];

    const rawApplications = JSON.parse(result.stdout);
    rawApplications.forEach((rawApplication: RawApplication) => {
      const application = new Application(
        rawApplication['metadata']['id'],
        rawApplication['entity']['name'],
        organizationId
      );
      applications.push(application);
    });

    return applications;
  }
}
