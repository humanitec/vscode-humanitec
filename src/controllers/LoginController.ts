import * as vscode from 'vscode';
import { ISecretRepository } from '../repos/SecretRepository';
import { SecretKey } from '../domain/SecretKey';
import { ILoggerService } from '../services/LoggerService';
import { ILoginService } from '../services/LoginService';
import { isHumanitecExtensionError } from '../errors/IHumanitecExtensionError';

export class LoginController {
  private constructor() {}

  static register(
    context: vscode.ExtensionContext,
    loginService: ILoginService,
    secrets: ISecretRepository,
    logger: ILoggerService
  ) {
    const disposable = vscode.commands.registerCommand(
      'humanitec.login',
      () => {
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            cancellable: true,
            title: 'Logging to Humanitec',
          },
          async () => {
            try {
              const deviceAuthorizationInfo =
                await loginService.initDeviceAuthorization();
              await secrets.set(
                SecretKey.DEVICE_ID,
                deviceAuthorizationInfo.deviceId
              );

              const url = vscode.Uri.parse(
                deviceAuthorizationInfo.verificationUrl
              );
              vscode.env.openExternal(url);

              const token = await loginService.confirmDeviceAuthorization(
                deviceAuthorizationInfo
              );
              await secrets.set(SecretKey.HUMANITEC_TOKEN, token);
              vscode.commands.executeCommand(
                'humanitec.sidebar.organization_structure.refreshEntries'
              );
              vscode.commands.executeCommand(
                'humanitec.sidebar.availableResources.refreshEntries'
              );
              vscode.window.showInformationMessage(
                'Humanitec extension successfully configured!'
              );
            } catch (error) {
              if (isHumanitecExtensionError(error)) {
                vscode.window.showErrorMessage(error.message());
                logger.error(error.details());
              } else {
                vscode.window.showErrorMessage(
                  'Unexpected error occurred. Please contact the extension developer'
                );
                logger.error(JSON.stringify({ error }));
              }
            }
          }
        );
      }
    );
    context.subscriptions.push(disposable);
  }
}
