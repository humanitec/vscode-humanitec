import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { Organization } from '../domain/Organization';
import { HumctlError } from '../errors/HumctlError';

export interface IOrganizationRepository {
  getAll(): Promise<Organization[]>;
}

interface RawOrganization {
  metadata: {
    id: string;
  };
  entity: {
    name: string;
  };
}

export class OrganizationRepository implements IOrganizationRepository {
  constructor(private humctl: IHumctlAdapter) {}

  async getAll(): Promise<Organization[]> {
    const result = await this.humctl.execute(['get', 'orgs']);
    if (result.stderr !== '') {
      throw new HumctlError('humctl get orgs', result.stderr, result.exitcode);
    }

    const organizations: Organization[] = [];

    const rawOrganizations = JSON.parse(result.stdout);
    rawOrganizations.forEach((rawOrganization: RawOrganization) => {
      const organization = new Organization(
        rawOrganization['metadata']['id'],
        rawOrganization['entity']['name']
      );
      organizations.push(organization);
    });

    return organizations;
  }
}
