import {
  ResourceType,
  ResourceTypeClass,
  ResourceTypeVariable,
} from '../domain/ResourceType';
import { IHumctlAdapter } from '../adapters/humctl/IHumctlAdapter';
import { NotFoundError } from '../errors/NotFoundError';
import { HumctlError } from '../errors/HumctlError';

export interface IResourceTypeRepository {
  getAvailable(): Promise<ResourceType[]>;
  get(name: string): Promise<ResourceType>;
  getAvailableRaw(organizationId: string): Promise<unknown>;
}

interface Properties {
  properties: {
    [key: string]: {
      description: string;
      title: string;
      type: string;
    };
  };
  required: string[];
}

interface OutputSchema {
  properties: {
    values?: Properties;
    secrets?: Properties;
  };
}

interface AvailableResourceTypeOutput {
  Name: string;
  Type: string;
  Category: string;
  InputsSchema: Properties;
  OutputsSchema: OutputSchema;
  Classes: { [key: string]: string };
}

export class ResourceTypeRepository implements IResourceTypeRepository {
  constructor(private humctl: IHumctlAdapter) {}

  async getAvailableRaw(organizationId: string): Promise<unknown> {
    const typesUrl = `/orgs/${organizationId}/resources/types`;
    const result = await this.humctl.execute(['api', 'get', typesUrl]);
    if (result.stderr !== '') {
      throw new HumctlError(
        'humctl api get ' + typesUrl,
        result.stderr,
        result.exitcode
      );
    }
    return JSON.parse(result.stdout);
  }

  async get(type: string): Promise<ResourceType> {
    const result = await this.humctl.execute([
      'score',
      'available-resource-types',
    ]);
    if (result.stderr !== '') {
      throw new HumctlError(
        'score available-resource-types',
        result.stderr,
        result.exitcode
      );
    }

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
      this.resolveProperties(resourceType.InputsSchema),
      this.resolveOutputSchema(resourceType.OutputsSchema),
      resourceTypeClasses
    );
  }

  async getAvailable(): Promise<ResourceType[]> {
    const result = await this.humctl.execute([
      'score',
      'available-resource-types',
    ]);
    if (result.stderr !== '') {
      throw new HumctlError(
        'score available-resource-types',
        result.stderr,
        result.exitcode
      );
    }

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
        this.resolveProperties(availableResourceType.InputsSchema),
        this.resolveOutputSchema(availableResourceType.OutputsSchema),
        resourceTypeClasses
      );
      resourceTypes.push(resourceType);
    });
    return resourceTypes;
  }

  private resolveOutputSchema(
    rawSchema: OutputSchema | null
  ): Map<string, ResourceTypeVariable> {
    const result = new Map<string, ResourceTypeVariable>();
    if (rawSchema === null) {
      return result;
    }
    const properties = rawSchema['properties'];
    if (properties === undefined) {
      return result;
    }

    if (properties.values) {
      const values = this.resolveProperties(properties['values']);
      values.forEach((value: ResourceTypeVariable, key: string) => {
        result.set(key, value);
      });
    }
    if (properties.secrets) {
      const secrets = this.resolveProperties(properties['secrets']);
      secrets.forEach((value: ResourceTypeVariable, key: string) => {
        result.set(key, value);
      });
    }

    return result;
  }

  private resolveProperties(
    rawVariables: Properties
  ): Map<string, ResourceTypeVariable> {
    const result = new Map<string, ResourceTypeVariable>();
    if (rawVariables === undefined || rawVariables === null) {
      return result;
    }
    const properties = rawVariables['properties'];
    if (properties === undefined) {
      return result;
    }

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

    return result;
  }
}
