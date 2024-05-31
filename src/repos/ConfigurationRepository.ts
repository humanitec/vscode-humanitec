import * as vscode from 'vscode';

import { ConfigKey } from '../domain/ConfigKey';

export interface IConfigurationRepository {
  get(key: ConfigKey): Promise<string>;
  set(key: ConfigKey, value: string): Promise<void>;
}

export class ConfigurationRepository implements IConfigurationRepository {
  async set(key: ConfigKey, value: string): Promise<void> {
    await vscode.workspace.getConfiguration('humanitec').update(key, value);
  }
  async get(key: ConfigKey): Promise<string> {
    let value = vscode.workspace.getConfiguration('humanitec').get<string>(key);
    if (value === undefined) {
      value = '';
    }
    return value;
  }
}
