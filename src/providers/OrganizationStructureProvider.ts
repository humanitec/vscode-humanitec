import * as vscode from 'vscode';
import { Organization } from '../domain/Organization';
import { Application } from '../domain/Application';
import { Environment } from '../domain/Environment';
import { IApplicationRepository } from '../repos/ApplicationRepository';
import { IOrganizationRepository } from '../repos/OrganizationRepository';
import { IEnvironmentRepository } from '../repos/EnvironmentRepository';
import { IConfigurationRepository } from '../repos/ConfigurationRepository';
import { ConfigKey } from '../domain/ConfigKey';
import path from 'path';

export class OrganizationStructureProvider
  implements vscode.TreeDataProvider<OrganizationStructureItem>
{
  constructor(
    private organizationRepository: IOrganizationRepository,
    private applicationRepository: IApplicationRepository,
    private environmentRepository: IEnvironmentRepository,
    private configurationRepository: IConfigurationRepository
  ) {}

  getTreeItem(
    element: OrganizationStructureItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    if (element instanceof Organization) {
      return this.configurationRepository
        .get(ConfigKey.HUMANITEC_ORG)
        .then((orgId: string) => {
          return new OrganizationStructureTreeItem(
            element,
            orgId === element.id
          );
        });
    } else if (element instanceof Application) {
      return this.configurationRepository
        .get(ConfigKey.HUMANITEC_ORG)
        .then((orgId: string) => {
          return this.configurationRepository
            .get(ConfigKey.HUMANITEC_APP)
            .then((appId: string) => {
              return new OrganizationStructureTreeItem(
                element,
                orgId === element.organizationId && appId === element.id
              );
            });
        });
    } else {
      return this.configurationRepository
        .get(ConfigKey.HUMANITEC_ORG)
        .then((orgId: string) => {
          return this.configurationRepository
            .get(ConfigKey.HUMANITEC_APP)
            .then((appId: string) => {
              return this.configurationRepository
                .get(ConfigKey.HUMANITEC_ENV)
                .then((envId: string) => {
                  return new OrganizationStructureTreeItem(
                    element,
                    orgId === element.organizationId &&
                      appId === element.applicationId &&
                      envId === element.id
                  );
                });
            });
        });
    }
  }

  getChildren(
    element?: OrganizationStructureItem | undefined
  ): vscode.ProviderResult<OrganizationStructureItem[]> {
    if (element === undefined) {
      return this.organizationRepository.getAll().then(organizations => {
        return Promise.resolve(organizations);
      });
    }
    if (element instanceof Organization) {
      return this.applicationRepository
        .getFrom(element.id)
        .then(applications => {
          return Promise.resolve(applications);
        });
    }
    if (element instanceof Application) {
      return this.environmentRepository
        .getFrom(element.organizationId, element.id)
        .then(environments => {
          return Promise.resolve(environments);
        });
    }
    return Promise.resolve([]);
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    OrganizationStructureItem | undefined | null | void
  > = new vscode.EventEmitter<
    OrganizationStructureItem | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<
    OrganizationStructureItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  public async refresh() {
    this._onDidChangeTreeData.fire();
  }
}

export type OrganizationStructureItem =
  | Organization
  | Application
  | Environment;

class OrganizationStructureTreeItem extends vscode.TreeItem {
  constructor(element: OrganizationStructureItem, isConfigured: boolean) {
    super(element.name);
    this.contextValue = 'set_in_workspace';

    if (element instanceof Organization) {
      this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
      this.iconPath = {
        light: path.join(
          __filename,
          '..',
          '..',
          '..',
          'media',
          'organization_light.svg'
        ),
        dark: path.join(
          __filename,
          '..',
          '..',
          '..',
          'media',
          'organization_dark.svg'
        ),
      };
    } else if (element instanceof Application) {
      this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
      this.iconPath = {
        light: path.join(
          __filename,
          '..',
          '..',
          '..',
          'media',
          'editor_layout_light.svg'
        ),
        dark: path.join(
          __filename,
          '..',
          '..',
          '..',
          'media',
          'editor_layout_dark.svg'
        ),
      };
    } else {
      this.collapsibleState = vscode.TreeItemCollapsibleState.None;
      this.iconPath = {
        light: path.join(
          __filename,
          '..',
          '..',
          '..',
          'media',
          'gear_light.svg'
        ),
        dark: path.join(__filename, '..', '..', '..', 'media', 'gear_dark.svg'),
      };
    }

    if (isConfigured) {
      this.description = 'in use';
    }
  }
}
