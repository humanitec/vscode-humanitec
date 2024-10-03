import * as vscode from 'vscode';
import { IScoreInitializationService } from '../services/ScoreInitializationService';
import { IErrorHandlerService } from '../services/ErrorHandlerService';

export class InitializeScoreFileController {
  private constructor() {}

  static register(
    context: vscode.ExtensionContext,
    initializationService: IScoreInitializationService,
    enable: boolean,
    errorHandler: IErrorHandlerService
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
          errorHandler.handle(error);
        }
      }
    );
    context.subscriptions.push(disposable);
  }
}
