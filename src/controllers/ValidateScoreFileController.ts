import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import { IScoreValidationService } from '../services/ScoreValidationService';
import {
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  Range,
  TextDocument,
} from 'vscode';
import { isHumanitecExtensionError } from '../errors/IHumanitecExtensionError';
import { ILoggerService } from '../services/LoggerService';
import { IConfigurationRepository } from '../repos/ConfigurationRepository';
import { ConfigKey } from '../domain/ConfigKey';

export class ValidateScoreFileController {
  private static instance: ValidateScoreFileController;

  private diagnosticCollections: Map<string, DiagnosticCollection>;

  private constructor(
    private validationService: IScoreValidationService,
    private config: IConfigurationRepository
  ) {
    this.diagnosticCollections = new Map();
  }

  static register(
    context: vscode.ExtensionContext,
    validationService: IScoreValidationService,
    config: IConfigurationRepository,
    logger: ILoggerService
  ) {
    if (this.instance === undefined) {
      this.instance = new ValidateScoreFileController(
        validationService,
        config
      );
    }

    let disposable = vscode.commands.registerCommand(
      'humanitec.score.validate',
      async () => {
        this.instance.diagnosticCollections.forEach(collection =>
          collection.dispose()
        );
        this.instance.diagnosticCollections.clear();

        const files = await vscode.workspace.findFiles('**/*.{yaml,yml}');
        files.forEach(async file => {
          try {
            const textDocument = await vscode.workspace.openTextDocument(file);

            if (this.instance.isScoreFile(textDocument)) {
              const diagnosticCollection =
                this.instance.getDiagnosticCollections(textDocument.uri.path);
              await this.instance.validate(
                textDocument,
                diagnosticCollection,
                context
              );
            }
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
        });
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.workspace.onDidRenameFiles(event => {
      event.files.forEach(async file => {
        try {
          this.instance.removeDiagnosticCollectionsIfExists(file.oldUri.path);

          const textDocument = await vscode.workspace.openTextDocument(
            file.newUri
          );
          if (this.instance.isScoreFile(textDocument)) {
            const diagnosticCollection = this.instance.getDiagnosticCollections(
              textDocument.uri.path
            );
            await this.instance.validate(
              textDocument,
              diagnosticCollection,
              context
            );
          }
        } catch (error) {
          logger.error(JSON.stringify({ error }));
        }
      });
    });
    context.subscriptions.push(disposable);

    disposable = vscode.workspace.onDidDeleteFiles(event => {
      event.files.forEach(file => {
        this.instance.removeDiagnosticCollectionsIfExists(file.path);
      });
    });
    context.subscriptions.push(disposable);

    disposable = vscode.workspace.onDidChangeTextDocument(async event => {
      try {
        this.instance.removeDiagnosticCollectionsIfExists(
          event.document.uri.path
        );

        if (this.instance.isScoreFile(event.document)) {
          const diagnosticCollection = this.instance.getDiagnosticCollections(
            event.document.uri.path
          );
          await this.instance.validate(
            event.document,
            diagnosticCollection,
            context
          );
        }
      } catch (error) {
        logger.error(JSON.stringify({ error }));
      }
    });
    context.subscriptions.push(disposable);
  }

  private getDiagnosticCollections(
    filepath: string
  ): vscode.DiagnosticCollection {
    let diagnosticCollection = this.diagnosticCollections.get(filepath);
    if (diagnosticCollection === undefined) {
      diagnosticCollection = vscode.languages.createDiagnosticCollection(
        'humanitec/score/' + filepath
      );
      this.diagnosticCollections.set(filepath, diagnosticCollection);
    }
    return diagnosticCollection;
  }

  private removeDiagnosticCollectionsIfExists(filename: string) {
    const diagnosticCollection = this.diagnosticCollections.get(filename);
    if (diagnosticCollection !== undefined) {
      diagnosticCollection.dispose();
      this.diagnosticCollections.delete(filename);
    }
  }

  private isScoreFile(textDocument: TextDocument): boolean {
    try {
      const loadedYamlDocument: unknown = yaml.load(textDocument.getText());
      if (!(loadedYamlDocument instanceof Object)) {
        return false;
      }
      return (
        'apiVersion' in loadedYamlDocument &&
        loadedYamlDocument['apiVersion'] === 'score.dev/v1b1'
      );
    } catch {
      return false;
    }
  }

  private statusBarItem: vscode.StatusBarItem | undefined;

  private async validate(
    textDocument: TextDocument,
    diagnosticCollection: vscode.DiagnosticCollection,
    context: vscode.ExtensionContext
  ) {
    if (this.statusBarItem == undefined) {
      this.statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right
      );
      this.statusBarItem.text = '$(warning) Only local validation';
      this.statusBarItem.tooltip =
        'There is no organization set so Humanitec Extension could only validate the Score files locally';
      context.subscriptions.push(this.statusBarItem);
    }

    const isOrganizationSet =
      (await this.config.get(ConfigKey.HUMANITEC_ORG)) !== '';

    if (!isOrganizationSet) {
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }

    const validationErrors = await this.validationService.validate(
      textDocument.uri.path,
      !isOrganizationSet
    );

    const diagnostics: Diagnostic[] = [];
    validationErrors.forEach(validationError => {
      const location = this.calculateStartLocation(
        textDocument,
        validationError.location
      );
      const range = new Range(
        location.row,
        location.column,
        location.row,
        textDocument.lineAt(location.row).range.end.character
      );
      const severity =
        validationError.level === 'ERROR'
          ? DiagnosticSeverity.Error
          : DiagnosticSeverity.Warning;

      const diagnostic = new Diagnostic(
        range,
        validationError.message,
        severity
      );
      diagnostics.push(diagnostic);
    });

    diagnosticCollection.set(textDocument.uri, diagnostics);
  }

  private calculateStartLocation(
    textDocument: TextDocument,
    errorLocation: string
  ): Location {
    const locations = errorLocation.substring(1).split('/');
    let index = 0;
    locations.forEach((location: string) => {
      const newIndex = textDocument.getText().indexOf(location, index);
      if (newIndex !== -1) {
        index = newIndex;
      }
    });

    let column: number = index;
    let row: number = 0;

    const perLine = textDocument.getText().split('\n');
    for (const line of perLine) {
      if (line.length >= column) {
        break;
      }
      row++;
      column -= line.length + 1;
    }

    return { column, row };
  }
}

interface Location {
  column: number;
  row: number;
}
