import * as vscode from 'vscode';
import { IConfigurationRepository } from '../repos/ConfigurationRepository';
import { ISecretRepository } from '../repos/SecretRepository';
import { SecretKey } from '../domain/SecretKey';
import { ConfigKey } from '../domain/ConfigKey';
import { IErrorHandlerService } from '../services/ErrorHandlerService';

export class OpenConfiguredTerminalController {
  private constructor() {}

  static register(
    context: vscode.ExtensionContext,
    configs: IConfigurationRepository,
    secrets: ISecretRepository,
    errorHandler: IErrorHandlerService
  ) {
    const disposable = vscode.commands.registerCommand(
      'humanitec.open_configured_terminal',
      async () => {
        try {
          const terminal = vscode.window.createTerminal('humanitec');

          const token = await secrets.get(SecretKey.HUMANITEC_TOKEN);
          terminal.sendText('export HUMANITEC_TOKEN=' + token);

          const org = await configs.get(ConfigKey.HUMANITEC_ORG);
          terminal.sendText('export HUMANITEC_ORG=' + org);
          terminal.sendText('export HUMANITEC_ORG_ID=' + org);

          const app = await configs.get(ConfigKey.HUMANITEC_APP);
          terminal.sendText('export HUMANITEC_APP=' + app);

          const env = await configs.get(ConfigKey.HUMANITEC_ENV);
          terminal.sendText('export HUMANITEC_ENV=' + env);

          terminal.sendText('clear');

          terminal.show();
        } catch (error) {
          errorHandler.handle(error);
        }
      }
    );
    context.subscriptions.push(disposable);
  }
}
