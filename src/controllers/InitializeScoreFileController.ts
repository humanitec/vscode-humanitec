import * as vscode from 'vscode';
import { IScoreInitializationService } from '../services/ScoreInitializationService';
import { ILoggerService } from '../services/LoggerService';
import { isHumanitecExtensionError } from '../errors/IHumanitecExtensionError';

export class InitializeScoreFileController {
  private constructor() {}

  static register(
    context: vscode.ExtensionContext,
    initializationService: IScoreInitializationService,
    enable: boolean,
    logger: ILoggerService
  ) {
    const disposable = vscode.commands.registerCommand(
      'humanitec.score.init',
      async () => {
        try {
          if (vscode.workspace.workspaceFolders !== undefined) {
            if (!enable) {
              vscode.window.showWarningMessage(
                'This command is still under development'
              );
              return;
            }

            // TODO: Figure out which workspace is active
            // TODO: Add printing score file in init
            const fileUri = vscode.Uri.file(
              vscode.workspace.workspaceFolders[0].uri.path +
                '/humanitec.score.yaml'
            );
            console.log(fileUri);
            const score = await initializationService.generateInitFile();
            await vscode.workspace.fs.writeFile(
              fileUri,
              new TextEncoder().encode(score)
            );
            vscode.window.showTextDocument(fileUri, {
              preview: false,
            });
          } else {
            vscode.window.showInformationMessage('No workspace is opened');
          }
        } catch (error) {
          if (isHumanitecExtensionError(error)) {
            logger.error(error.details());
            vscode.window.showErrorMessage(error.message());
          } else {
            logger.error(JSON.stringify({ error }));
            vscode.window.showErrorMessage(
              'Unexpected error occurred. Please contact the extension developer'
            );
          }
        }
      }
    );
    context.subscriptions.push(disposable);
  }
}
