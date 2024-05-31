import { HumctlResult } from './HumctlResult';

export interface IHumctlAdapter {
  execute(command: string[]): Promise<HumctlResult>;
}
