import * as vscode from 'vscode';
import {
  AvailableResourceTypesProvider,
  ResourceTypeTreeItem,
} from '../providers/AvailableResourceTypesProvider';
import { IResourceTypeRepository } from '../repos/ResourceTypeRepository';
import { ILoggerService } from '../services/LoggerService';
import { isHumanitecExtensionError } from '../errors/IHumanitecExtensionError';
import {
  OrganizationStructureItem,
  OrganizationStructureProvider,
} from '../providers/OrganizationStructureProvider';
import { IOrganizationRepository } from '../repos/OrganizationRepository';
import { IApplicationRepository } from '../repos/ApplicationRepository';
import { IEnvironmentRepository } from '../repos/EnvironmentRepository';
import { IConfigurationRepository } from '../repos/ConfigurationRepository';
import { Organization } from '../domain/Organization';
import { ConfigKey } from '../domain/ConfigKey';
import { Application } from '../domain/Application';
import { ControllerIsAlreadyRegisteredError } from '../errors/ControllerIsAlreadyRegisteredError';

export class HumanitecSidebarController {
  private static instance: HumanitecSidebarController;

  private constructor(
    public readonly availableResourceTypesProvider: AvailableResourceTypesProvider,
    public readonly organizationStructureProvider: OrganizationStructureProvider
  ) {}

  static register(
    context: vscode.ExtensionContext,
    resourceTypeRepository: IResourceTypeRepository,
    organizationRepository: IOrganizationRepository,
    applicationRepository: IApplicationRepository,
    environmentRepository: IEnvironmentRepository,
    configurationRepository: IConfigurationRepository,
    logger: ILoggerService
  ) {
    if (this.instance !== undefined) {
      throw new ControllerIsAlreadyRegisteredError(
        'HumanitecSidebarController'
      );
    }

    const availableResourceTypesProvider = new AvailableResourceTypesProvider(
      resourceTypeRepository
    );
    const organizationStructureProvider = new OrganizationStructureProvider(
      organizationRepository,
      applicationRepository,
      environmentRepository,
      configurationRepository
    );
    this.instance = new HumanitecSidebarController(
      availableResourceTypesProvider,
      organizationStructureProvider
    );

    vscode.window.registerTreeDataProvider(
      'humanitec-sidebar-available-resource-types',
      availableResourceTypesProvider
    );

    vscode.window.registerTreeDataProvider(
      'humanitec-sidebar-organization-structure',
      organizationStructureProvider
    );

    let disposable = vscode.commands.registerCommand(
      'humanitec.sidebar.availableResources.refreshEntries',
      async () => {
        try {
          availableResourceTypesProvider.refresh();
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

    disposable = vscode.commands.registerCommand(
      'humanitec.sidebar.organization_structure.refreshEntries',
      async () => {
        try {
          organizationStructureProvider.refresh();
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

    disposable = vscode.commands.registerCommand(
      'humanitec.sidebar.availableResources.open_resource_type_doc',
      async (resourceType: ResourceTypeTreeItem) => {
        try {
          let url = vscode.Uri.parse(
            'https://developer.humanitec.com/platform-orchestrator/reference/resource-types/'
          );
          if (resourceType !== undefined) {
            url = vscode.Uri.parse(
              'https://developer.humanitec.com/platform-orchestrator/reference/resource-types/#' +
                resourceType.resourceType
            );
          }
          vscode.env.openExternal(url);
        } catch (error) {
          logger.error(JSON.stringify({ error }));
          vscode.window.showErrorMessage(
            'Unexpected error occurred. Please contact the extension developer'
          );
        }
      }
    );
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand(
      'humanitec.sidebar.organization_structure.set_in_workspace',
      async (item: OrganizationStructureItem) => {
        try {
          if (item instanceof Organization) {
            await configurationRepository.set(ConfigKey.HUMANITEC_ENV, '');
            await configurationRepository.set(ConfigKey.HUMANITEC_APP, '');
            const orgId = await configurationRepository.get(
              ConfigKey.HUMANITEC_ORG
            );
            if (orgId !== item.id) {
              await configurationRepository.set(
                ConfigKey.HUMANITEC_ORG,
                item.id
              );
            }
            vscode.commands.executeCommand('humanitec.score.validate');
          } else if (item instanceof Application) {
            await configurationRepository.set(ConfigKey.HUMANITEC_ENV, '');
            const orgId = await configurationRepository.get(
              ConfigKey.HUMANITEC_ORG
            );
            const appId = await configurationRepository.get(
              ConfigKey.HUMANITEC_APP
            );
            if (orgId !== item.organizationId || appId !== item.id) {
              await configurationRepository.set(
                ConfigKey.HUMANITEC_APP,
                item.id
              );
              await configurationRepository.set(
                ConfigKey.HUMANITEC_ORG,
                item.organizationId
              );
            }
          } else {
            await configurationRepository.set(ConfigKey.HUMANITEC_ENV, item.id);
            await configurationRepository.set(
              ConfigKey.HUMANITEC_APP,
              item.applicationId
            );
            await configurationRepository.set(
              ConfigKey.HUMANITEC_ORG,
              item.organizationId
            );
          }
          await availableResourceTypesProvider.refresh();
          await organizationStructureProvider.refresh();
        } catch (error) {
          logger.error(JSON.stringify({ error }));
          vscode.window.showErrorMessage(
            'Unexpected error occurred. Please contact the extension developer'
          );
        }
      }
    );
    context.subscriptions.push(disposable);
  }

  static getInstance(): HumanitecSidebarController {
    return this.instance;
  }
}
