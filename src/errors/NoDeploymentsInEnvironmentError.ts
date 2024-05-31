import { IHumanitecExtensionError } from './IHumanitecExtensionError';

export class NoDeploymentsInEnvironmentError
  implements IHumanitecExtensionError
{
  constructor(private environment: string) {}

  message(): string {
    return `Environment ${this.environment} has no deployments. Deploy application to ${this.environment} environment first.`;
  }

  details(): string {
    return this.message();
  }
}
