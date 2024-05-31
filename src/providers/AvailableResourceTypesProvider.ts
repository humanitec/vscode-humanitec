import * as vscode from 'vscode';
import { ResourceType, ResourceTypeVariable } from '../domain/ResourceType';
import { IResourceTypeRepository } from '../repos/ResourceTypeRepository';

export class AvailableResourceTypesProvider
  implements vscode.TreeDataProvider<AvailableResourceTypesTreeItem>
{
  constructor(private resourceTypeRepository: IResourceTypeRepository) {}

  getTreeItem(element: AvailableResourceTypesTreeItem): vscode.TreeItem {
    if (element instanceof ResourceType) {
      return new ResourceTypeTreeItem(element.type, element.name);
    } else if (element instanceof AvailableResourceTypesIO) {
      return new ResourceTypeTreeItemIO(element.name);
    } else {
      return new ResourceTypeTreeItemIOValue(
        element.name,
        element.variable.type
      );
    }
  }

  getChildren(
    element: AvailableResourceTypesTreeItem
  ): Thenable<AvailableResourceTypesTreeItem[]> {
    if (element === undefined) {
      return this.resourceTypeRepository.getAvailable().then(resourceTypes => {
        return Promise.resolve(resourceTypes);
      });
    } else if (element instanceof ResourceType) {
      return Promise.resolve([
        new AvailableResourceTypesIO('inputs', element.type),
        new AvailableResourceTypesIO('outputs', element.type),
      ]);
    } else if (element instanceof AvailableResourceTypesIO) {
      return this.resourceTypeRepository
        .get(element.resourceType)
        .then(resourceType => {
          const result: ResourceTypeVariableWithName[] = [];
          if (element.name === 'inputs') {
            resourceType.inputs.forEach(
              (value: ResourceTypeVariable, key: string) => {
                result.push(new ResourceTypeVariableWithName(key, value));
              }
            );
          } else {
            resourceType.outputs.forEach(
              (value: ResourceTypeVariable, key: string) => {
                result.push(new ResourceTypeVariableWithName(key, value));
              }
            );
          }
          return Promise.resolve(result);
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
  | ResourceType
  | AvailableResourceTypesIO
  | ResourceTypeVariableWithName;

class AvailableResourceTypesIO {
  constructor(
    public readonly name: string,
    public readonly resourceType: string
  ) {}
}

class ResourceTypeVariableWithName {
  constructor(
    public readonly name: string,
    public readonly variable: ResourceTypeVariable
  ) {}
}

class ResourceTypeTreeItem extends vscode.TreeItem {
  constructor(label: string, description: string) {
    super(label);
    this.description = description;
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    this.contextValue = 'resource_type';
  }
}

class ResourceTypeTreeItemIO extends vscode.TreeItem {
  constructor(label: string) {
    super(label);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }
}

class ResourceTypeTreeItemIOValue extends vscode.TreeItem {
  constructor(label: string, description: string) {
    super(label);
    this.description = description;
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
  }
}
