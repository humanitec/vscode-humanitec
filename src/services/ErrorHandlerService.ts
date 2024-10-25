import * as vscode from 'vscode';
import { ILoggerService } from './LoggerService';
import { IHumanitecExtensionError } from '../errors/IHumanitecExtensionError';

export interface IErrorHandlerService {
  handle(error: unknown): void;
}

export class ErrorHandlerService implements IErrorHandlerService {
  constructor(
    private readonly logger: ILoggerService,
    private readonly outputChannel: vscode.OutputChannel
  ) {}

  handle(error: unknown) {
    if (this.isHumanitecExtensionError(error)) {
      this.logger.error(error.details());
      this.showErrorMessage(error.message());
    } else if (error instanceof Error) {
      // Validation may fail if the document changed (object is already disposed) during the validation process
      if (error.message === 'illegal state - object is disposed') {
        return;
      }

      this.logger.error(
        JSON.stringify({
          message: error.message,
          stack: error.stack,
          name: error.name,
        })
      );
      this.showErrorMessage(
        'Unexpected error occurred. More details in the output'
      );
    } else {
      this.logger.error(JSON.stringify({ error }));
      this.showErrorMessage(
        'Unexpected error occurred. Please contact the extension developer'
      );
    }
  }

  private async showErrorMessage(message: string): Promise<void> {
    const showOutputButton = 'Show output log';
    const action = await vscode.window.showErrorMessage(
      message,
      showOutputButton
    );
    if (action === showOutputButton) {
      this.outputChannel.show();
    }
  }

  private isHumanitecExtensionError(
    error: unknown
  ): error is IHumanitecExtensionError {
    const isObject = error !== null && typeof error === 'object';
    if (isObject) {
      const hasMessage = 'message' in error;
      const hasDetails = 'details' in error;
      return hasMessage && hasDetails;
    }
    return false;
  }
}
