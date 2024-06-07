export class ResourceType {
  constructor(
    public readonly category: string,
    public readonly name: string,
    public readonly type: string,
    public readonly inputs: Map<string, ResourceTypeVariable>,
    public readonly outputs: Map<string, ResourceTypeVariable>,
    public readonly classes: ResourceTypeClass[]
  ) {}
}

export class ResourceTypeVariable {
  constructor(
    public readonly description: string,
    public readonly title: string,
    public readonly type: string,
    public readonly required: boolean
  ) {}
}

export class ResourceTypeClass {
  constructor(
    public readonly id: string,
    public readonly description: string
  ) {}
}
