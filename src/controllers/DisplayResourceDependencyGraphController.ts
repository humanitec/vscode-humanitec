import * as vscode from 'vscode';
import { IErrorHandlerService } from '../services/ErrorHandlerService';
import { IActiveResourcesRepository } from '../repos/ActiveResourcesRepository';
import { IDependencyGraphRepository } from '../repos/DependencyGraphRepository';
import { IDeploymentRepository } from '../repos/DeploymentRepository';
import { IResourceTypeRepository } from '../repos/ResourceTypeRepository';
import { IConfigurationRepository } from '../repos/ConfigurationRepository';
import { IResourceDefinitionRepository } from '../repos/ResourceDefinitionRepository';
import { ConfigKey } from '../domain/ConfigKey';
import { IEnvironmentRepository } from '../repos/EnvironmentRepository';
import { NoDeploymentsInEnvironmentError } from '../errors/NoDeploymentsInEnvironmentError';

export class DisplayResourcesGraphController {
  private constructor() {}

  static register(
    context: vscode.ExtensionContext,
    activeResourcesRepository: IActiveResourcesRepository,
    dependencyGraphRepository: IDependencyGraphRepository,
    deploymentRepository: IDeploymentRepository,
    ResourceDefinitionRepository: IResourceDefinitionRepository,
    resourceTypeRepository: IResourceTypeRepository,
    environmentRepository: IEnvironmentRepository,
    configs: IConfigurationRepository,
    errorHandler: IErrorHandlerService
  ) {
    const disposable = vscode.commands.registerCommand(
      'humanitec.display_resources_graph',
      async () => {
        try {
          const orgId = await configs.get(ConfigKey.HUMANITEC_ORG);
          const appId = await configs.get(ConfigKey.HUMANITEC_APP);
          const envId = await configs.get(ConfigKey.HUMANITEC_ENV);

          const environment = await environmentRepository.get(
            orgId,
            appId,
            envId
          );

          if (!environment.lastDeploymentId) {
            throw new NoDeploymentsInEnvironmentError(envId);
          }

          const panel = vscode.window.createWebviewPanel(
            'webview',
            'Resource Dependency Graph',
            vscode.ViewColumn.One,
            {
              enableScripts: true,
            }
          );
          const scriptSrc = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(
              context.extensionUri,
              'webview',
              'resource-dependency-graph',
              'dist',
              'index.js'
            )
          );

          const cssSrc = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(
              context.extensionUri,
              'webview',
              'resource-dependency-graph',
              'dist',
              'index.css'
            )
          );

          panel.webview.onDidReceiveMessage(async msg => {
            switch (msg.command) {
              case 'resource-dependency-graph-send-data':
                try {
                  const activeResources =
                    await activeResourcesRepository.getRaw(orgId, appId, envId);

                  const deployment = await deploymentRepository.getLatestRaw(
                    orgId,
                    appId,
                    envId,
                    environment.lastDeploymentId!
                  );
                  interface DeploymentObject {
                    dependency_graph_id: string;
                  }
                  const dependencyGraph =
                    await dependencyGraphRepository.getRaw(
                      orgId,
                      appId,
                      envId,
                      (deployment as DeploymentObject).dependency_graph_id
                    );
                  const resourceDefinitions =
                    await ResourceDefinitionRepository.getAllRaw(orgId);
                  const resourceTypes =
                    await resourceTypeRepository.getAvailableRaw(orgId);
                  panel.webview.postMessage({
                    type: 'resource-dependency-graph-data',
                    value: {
                      activeResources,
                      deployment,
                      dependencyGraph,
                      resourceDefinitions,
                      resourceTypes,
                    },
                  });
                } catch (error) {
                  errorHandler.handle(error);
                }
                break;
            }
          });

          panel.webview.html = `<!DOCTYPE html>
        <html lang="en">
          <head>
            <link rel="stylesheet" href="${cssSrc}" />
          </head>
          <body>
            <noscript>You need to enable JavaScript to run this app.</noscript>
            <div id="root"></div>
            <script>
              //declare the vscode variable to be used in the front-end
              const vscode = acquireVsCodeApi();
              
              //send a message to confirm everything is working properly
              window.onload = function() {
                vscode.postMessage({ command: 'resource-dependency-graph-send-data' });
                console.log('HTML started up.');
              };
            </script>
            <script src="${scriptSrc}"></script>
          </body>
        </html>
        `;
        } catch (error) {
          errorHandler.handle(error);
        }
      }
    );
    context.subscriptions.push(disposable);
  }
}
