import * as vscode from 'vscode';
import { IResourceDependencyGraphService } from '../services/ResourcesGraphService';
import { isHumanitecExtensionError } from '../errors/IHumanitecExtensionError';
import { ILoggerService } from '../services/LoggerService';

export class DisplayResourcesGraphController {
  private constructor() {}

  static register(
    context: vscode.ExtensionContext,
    resourcesGraphService: IResourceDependencyGraphService,
    logger: ILoggerService
  ) {
    const disposable = vscode.commands.registerCommand(
      'humanitec.display_resources_graph',
      async () => {
        try {
          const graph = await resourcesGraphService.generate();

          const panel = vscode.window.createWebviewPanel(
            'humanitec_resources_graph',
            'Resources Graph',
            vscode.ViewColumn.One,
            {
              enableScripts: true,
            }
          );
          panel.webview.html = this.getWebviewContent(graph);
        } catch (error) {
          if (isHumanitecExtensionError(error)) {
            vscode.window.showErrorMessage(error.message());
            logger.error(error.details());
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

  private static getWebviewContent(graph: string): string {
    return `<!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
            </head>
            <body>
                <script src="https://d3js.org/d3.v5.min.js"></script>
                <script src="https://unpkg.com/@hpcc-js/wasm@0.3.11/dist/index.min.js"></script>
                <script src="https://unpkg.com/d3-graphviz@3.0.5/build/d3-graphviz.js"></script>
                <div id="graph" style="text-align: center;"></div>
                <script>
                d3.select("#graph").graphviz().renderDot(\`${graph}\`);
                </script>
            </body>
        </html>`;
  }
}
