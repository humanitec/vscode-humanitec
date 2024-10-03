import * as vscode from 'vscode';
import { ISecretRepository } from '../repos/SecretRepository';
import { SecretKey } from '../domain/SecretKey';
import { IErrorHandlerService } from '../services/ErrorHandlerService';

export class SetTokenController {
  private constructor() {}

  static register(
    context: vscode.ExtensionContext,
    secrets: ISecretRepository,
    errorHandler: IErrorHandlerService
  ) {
    const disposable = vscode.commands.registerCommand(
      'humanitec.set_token',
      async () => {
        try {
          const token = await secrets.get(SecretKey.HUMANITEC_TOKEN);
          const value = await vscode.window.showInputBox({
            prompt: 'Humanitec token',
            value: token,
            password: true,
            ignoreFocusOut: true,
          });
          if (value !== undefined) {
            await secrets.set(SecretKey.HUMANITEC_TOKEN, value);
            vscode.commands.executeCommand(
              'humanitec.sidebar.organization_structure.refreshEntries'
            );
            vscode.commands.executeCommand(
              'humanitec.sidebar.availableResources.refreshEntries'
            );
            vscode.window.showInformationMessage(
              'Humanitec extension successfully configured!'
            );
          }
        } catch (error) {
          errorHandler.handle(error);
        }
      }
    );
    context.subscriptions.push(disposable);
  }
}
