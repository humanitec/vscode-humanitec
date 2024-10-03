import * as vscode from 'vscode';
import { ResourceTypeVariable } from '../domain/ResourceType';
import { IResourceTypeRepository } from '../repos/ResourceTypeRepository';
import { IErrorHandlerService } from '../services/ErrorHandlerService';

export class AvailableResourceTypesProvider
  implements vscode.TreeDataProvider<AvailableResourceTypesTreeItem>
{
  constructor(
    private resourceTypeRepository: IResourceTypeRepository,
    private errorHandler: IErrorHandlerService
  ) {}

  getTreeItem(element: AvailableResourceTypesTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(
    element: AvailableResourceTypesTreeItem
  ): Thenable<AvailableResourceTypesTreeItem[]> {
    if (element === undefined) {
      return this.resourceTypeRepository
        .getAvailable()
        .then(resourceTypes =>
          Promise.resolve(
            resourceTypes.map(resourceType => {
              return new ResourceTypeTreeItem(
                resourceType.type,
                resourceType.name
              );
            })
          )
        )
        .catch(error => {
          this.errorHandler.handle(error);
          return [];
        });
    } else if (element instanceof ResourceTypeTreeItem) {
      return Promise.resolve([
        new ResourceTypePropertyTreeItem('inputs', element.resourceType),
        new ResourceTypePropertyTreeItem('outputs', element.resourceType),
        new ResourceTypePropertyTreeItem('classes', element.resourceType),
      ]);
    } else if (element instanceof ResourceTypePropertyTreeItem) {
      return this.resourceTypeRepository
        .get(element.resourceType)
        .then(resourceType => {
          const vars: ResourceTypePropertyValueTreeItem[] = [];
          if (element.property === 'inputs') {
            resourceType.inputs.forEach(
              (value: ResourceTypeVariable, key: string) => {
                vars.push(
                  new ResourceTypePropertyValueTreeItem(key, value.description)
                );
              }
            );
          } else if (element.property === 'outputs') {
            resourceType.outputs.forEach(
              (value: ResourceTypeVariable, key: string) => {
                vars.push(
                  new ResourceTypePropertyValueTreeItem(key, value.description)
                );
              }
            );
          } else {
            resourceType.classes.forEach(resourceTypeClass => {
              vars.push(
                new ResourceTypePropertyValueTreeItem(
                  resourceTypeClass.id,
                  resourceTypeClass.description
                )
              );
            });
          }
          return Promise.resolve(vars);
        })
        .catch(error => {
          this.errorHandler.handle(error);
          return [];
        });
    }
    return Promise.resolve([]);
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    AvailableResourceTypesTreeItem | undefined | null | void
  > = new vscode.EventEmitter<
    AvailableResourceTypesTreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<
    AvailableResourceTypesTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  public async refresh() {
    this._onDidChangeTreeData.fire();
  }
}

export type AvailableResourceTypesTreeItem =
  | ResourceTypeTreeItem
  | ResourceTypePropertyTreeItem
  | ResourceTypePropertyValueTreeItem;

export class ResourceTypeTreeItem extends vscode.TreeItem {
  constructor(
    public readonly resourceType: string,
    public readonly name: string
  ) {
    super(resourceType);
    this.description = name;
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    this.contextValue = 'resource_type';
  }
}

class ResourceTypePropertyTreeItem extends vscode.TreeItem {
  constructor(
    public readonly property: string,
    public readonly resourceType: string
  ) {
    super(property);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }
}

class ResourceTypePropertyValueTreeItem extends vscode.TreeItem {
  constructor(value: string, description: string) {
    super(value);
    this.description = description;
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
  }
}
