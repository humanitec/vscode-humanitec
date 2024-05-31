export class ResourceType {
  constructor(
    public readonly category: string,
    public readonly name: string,
    public readonly type: string,
    public readonly inputs: Map<string, ResourceTypeVariable>,
    public readonly outputs: Map<string, ResourceTypeVariable>
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
