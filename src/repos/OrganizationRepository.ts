import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { Organization } from '../domain/Organization';

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
