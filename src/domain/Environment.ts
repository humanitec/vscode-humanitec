export class Environment {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly organizationId: string,
    public readonly applicationId: string,
    public readonly lastDeploymentId: string | null
  ) {}
}
