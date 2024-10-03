import * as vscode from 'vscode';
import { ISecretRepository } from '../repos/SecretRepository';
import { SecretKey } from '../domain/SecretKey';
import { ILoginService } from '../services/LoginService';
import { IErrorHandlerService } from '../services/ErrorHandlerService';

export class LoginController {
  private constructor() {}

  static register(
    context: vscode.ExtensionContext,
    loginService: ILoginService,
    secrets: ISecretRepository,
    errorHandler: IErrorHandlerService
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
              errorHandler.handle(error);
            }
          }
        );
      }
    );
    context.subscriptions.push(disposable);
  }
}
