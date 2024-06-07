import {
  ResourceType,
  ResourceTypeClass,
  ResourceTypeVariable,
} from '../domain/ResourceType';
import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { NotFoundError } from '../errors/NotFoundError';

export interface IResourceTypeRepository {
  getAvailable(): Promise<ResourceType[]>;
  get(name: string): Promise<ResourceType>;
}

interface AvailableResourceTypeOutput {
  Name: string;
  Type: string;
  Category: string;
  InputsSchema: any;
  OutputsSchema: any;
  // Casting JSON to Map<string, string> doesn't work as expected, that's why it has to be any
  Classes: any;
}

export class ResourceTypeRepository implements IResourceTypeRepository {
  constructor(private humctl: IHumctlAdapter) {}

  async get(type: string): Promise<ResourceType> {
    const result = await this.humctl.execute([
      'score',
      'available-resource-types',
    ]);

    const resourceTypes = JSON.parse(
      result.stdout
    ) as AvailableResourceTypeOutput[];
    const resourceType = resourceTypes.find(
      rawResourceType => rawResourceType.Type === type
    );
    if (!resourceType) {
      throw new NotFoundError();
    }

    const resourceTypeClasses: ResourceTypeClass[] = [];
    for (const key in resourceType.Classes) {
      resourceTypeClasses.push(
        new ResourceTypeClass(key, resourceType.Classes[key])
      );
    }

    return new ResourceType(
      resourceType.Category,
      resourceType.Name,
      resourceType.Type,
      this.resolveVariables(resourceType.InputsSchema),
      this.resolveVariables(resourceType.OutputsSchema),
      resourceTypeClasses
    );
  }

  async getAvailable(): Promise<ResourceType[]> {
    const result = await this.humctl.execute([
      'score',
      'available-resource-types',
    ]);
    const resourceTypes: ResourceType[] = [];

    const availableResourceTypes = JSON.parse(
      result.stdout
    ) as AvailableResourceTypeOutput[];
    availableResourceTypes.forEach(availableResourceType => {
      const resourceTypeClasses: ResourceTypeClass[] = [];
      for (const key in availableResourceType.Classes) {
        resourceTypeClasses.push(
          new ResourceTypeClass(key, availableResourceType.Classes[key])
        );
      }

      const resourceType = new ResourceType(
        availableResourceType.Category,
        availableResourceType.Name,
        availableResourceType.Type,
        this.resolveVariables(availableResourceType.InputsSchema),
        this.resolveVariables(availableResourceType.OutputsSchema),
        resourceTypeClasses
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
