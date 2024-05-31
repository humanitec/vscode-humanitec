import * as vscode from 'vscode';
import { SecretKey } from '../domain/SecretKey';
import { homedir } from 'os';
import path from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'yaml';
import { ILoggerService } from '../services/LoggerService';

export interface ISecretRepository {
  get(key: SecretKey): Promise<string>;
  set(key: SecretKey, value: string): Promise<void>;
}

export class SecretRepository implements ISecretRepository {
  constructor(
    private secrets: vscode.SecretStorage,
    private logger: ILoggerService
  ) {}

  async set(key: SecretKey, value: string): Promise<void> {
    const configPath = path.join(homedir(), '.humctl');
    let configFile: Buffer = Buffer.from([]);
    try {
      configFile = readFileSync(configPath);
    } catch (error: any) {
      if (error.code && error.code === 'ENOENT') {
        console.log(error);
      } else {
        throw error;
      }
    }
    try {
      let config = parse(configFile.toString());
      if (config === null) {
        config = {};
      }
      config[key] = value;
      const configString = stringify(config);
      writeFileSync(configPath, configString);
    } catch (error) {
      console.log(error);
    }
  }
  async get(key: SecretKey): Promise<string> {
    try {
      const configPath = path.join(homedir(), '.humctl');
      const configFile = readFileSync(configPath);
      const config = parse(configFile.toString());
      let value = config[key];
      if (value === undefined) {
        value = '';
      }
      return value;
    } catch (error: any) {
      if (error.code && error.code === 'ENOENT') {
        return '';
      } else {
        throw error;
      }
    }
  }
}
