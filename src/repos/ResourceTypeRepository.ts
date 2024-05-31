import { ResourceType, ResourceTypeVariable } from '../domain/ResourceType';
import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { NotFoundError } from '../errors/NotFoundError';

export interface IResourceTypeRepository {
  getAvailable(): Promise<ResourceType[]>;
  get(name: string): Promise<ResourceType>;
}

export class ResourceTypeRepository implements IResourceTypeRepository {
  constructor(private humctl: IHumctlAdapter) {}

  async get(type: string): Promise<ResourceType> {
    const result = await this.humctl.execute([
      'score',
      'available-resource-types',
    ]);

    const rawResourceTypes = JSON.parse(result.stdout);
    const rawResourceType = rawResourceTypes.find(
      (rawResourceType: any) => rawResourceType['Type'] === type
    );
    if (!rawResourceType) {
      throw new NotFoundError();
    }
    return new ResourceType(
      rawResourceType['Category'],
      rawResourceType['Name'],
      rawResourceType['Type'],
      this.resolveVariables(rawResourceType['InputsSchema']),
      this.resolveVariables(rawResourceType['OutputsSchema'])
    );
  }

  async getAvailable(): Promise<ResourceType[]> {
    const result = await this.humctl.execute([
      'score',
      'available-resource-types',
    ]);
    const resourceTypes: ResourceType[] = [];

    const rawResourceTypes = JSON.parse(result.stdout);
    rawResourceTypes.forEach((rawResourceType: any) => {
      const resourceType = new ResourceType(
        rawResourceType['Category'],
        rawResourceType['Name'],
        rawResourceType['Type'],
        this.resolveVariables(rawResourceType['InputsSchema']),
        this.resolveVariables(rawResourceType['OutputsSchema'])
      );
      resourceTypes.push(resourceType);
    });
    return resourceTypes;
  }

  private resolveVariables(
    rawVariables: any
  ): Map<string, ResourceTypeVariable> {
    const result = new Map<string, ResourceTypeVariable>();
    if (rawVariables === null) {
      return result;
    }
    const properties = rawVariables['properties'];
    if (properties === undefined) {
      return result;
    }

    if ('values' in properties) {
      const values = this.resolveVariables(properties['values']);
      values.forEach((value: ResourceTypeVariable, key: string) => {
        result.set(key, value);
      });
    }
    if ('secrets' in properties) {
      const secrets = this.resolveVariables(properties['secrets']);
      secrets.forEach((value: ResourceTypeVariable, key: string) => {
        result.set(key, value);
      });
    }

    if (!('values' in properties || 'secrets' in properties)) {
      let requiredProperties: string[] = rawVariables['required'];
      if (requiredProperties === undefined) {
        requiredProperties = [];
      }

      let property: keyof typeof properties;
      for (property in properties) {
        const variable = new ResourceTypeVariable(
          properties[property]['description'],
          properties[property]['title'],
          properties[property]['type'],
          requiredProperties.includes(property)
        );
        result.set(property, variable);
      }
    }

    return result;
  }
}
