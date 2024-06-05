import { suite, beforeEach, afterEach, test } from 'mocha';
import path from 'path';
import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
const expect = chai.expect;
chai.use(sinonChai);

import * as vscode from 'vscode';
import { Organization } from '../../domain/Organization';

import waitForExpect from 'wait-for-expect';
import { HumanitecSidebarController } from '../../controllers/HumanitecSidebarController';
import { ConfigurationRepository } from '../../repos/ConfigurationRepository';
import { ConfigKey } from '../../domain/ConfigKey';
import { Environment } from '../../domain/Environment';
import { loggerChannel } from '../../extension';

const wait = (ms: number) =>
  new Promise<void>(resolve => setTimeout(() => resolve(), ms));

const readEnv = (name: string): string => {
  if (!process.env[name]) {
    throw new Error(`${name} not set`);
  }
  return process.env[name] || '';
};

suite('Extension Test Suite', () => {
  let workspaceFolder: string;
  let humanitecOrg: string;
  let humanitecToken: string;
  let sandbox: sinon.SinonSandbox;
  let showErrorMessage: sinon.SinonSpy;

  const outputs: string[] = [];

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    showErrorMessage = sandbox
      .stub(vscode.window, 'showErrorMessage')
      .callsFake(
        (message, ...items): Thenable<vscode.MessageItem | undefined> => {
          console.log('showErrorMessage', message, ...items);
          return Promise.resolve(undefined);
        }
      );

    sandbox.stub(loggerChannel, 'appendLine').callsFake((value: string) => {
      console.log('output', value);
      outputs.push(value);
    });

    humanitecOrg = readEnv('TEST_HUMANITEC_ORG');
    humanitecToken = readEnv('TEST_HUMANITEC_TOKEN');

    if (!vscode.workspace.workspaceFolders) {
      throw new Error('Workspace folder not found');
    }
    workspaceFolder = vscode.workspace.workspaceFolders[0].uri.path;

    const ext = vscode.extensions.getExtension('humanitec.humanitec');
    if (!ext) {
      throw new Error('Extension not found');
    }
    await ext.activate();
  });

  afterEach(() => {
    sandbox.restore();
  });

  test('score.validate - without login', async () => {
    const doc = await vscode.workspace.openTextDocument(
      path.join(workspaceFolder, './score.yaml')
    );

    await vscode.window.showTextDocument(doc);
    await vscode.commands.executeCommand('humanitec.score.validate');

    await waitForExpect(
      () => {
        expect(showErrorMessage).to.have.been.called;
      },
      10000,
      500
    );

    expect(showErrorMessage).to.have.been.calledWith(
      'There is no enough context to process the request. Required context is: Organization'
    );
  });

  test('score.validate - with login', async () => {
    const doc = await vscode.workspace.openTextDocument(
      path.join(workspaceFolder, './score.yaml')
    );

    await vscode.window.showTextDocument(doc);

    sandbox.stub(vscode.window, 'showInputBox').resolves(humanitecToken);

    await vscode.commands.executeCommand('humanitec.set_token');

    await wait(100);

    await vscode.commands.executeCommand(
      'humanitec.sidebar.organization_structure.set_in_workspace',
      new Organization(humanitecOrg, 'test-org')
    );

    await wait(100);

    await vscode.commands.executeCommand('humanitec.score.validate');

    let diagnostics: vscode.Diagnostic[] = [];

    await waitForExpect(
      () => {
        diagnostics = vscode.languages.getDiagnostics(doc.uri);
        expect(diagnostics).not.to.be.empty;
      },
      10000,
      500
    );

    const invalidPropertyErrorMessage =
      "additionalProperties 'invalid' not allowed";

    const invalidProperty = diagnostics.find(
      diagnostic => diagnostic.message === invalidPropertyErrorMessage
    );

    expect(
      invalidProperty,
      `Expected invalid property error in: ${JSON.stringify(diagnostics, null, 2)}`
    ).to.be.ok;
  });

  test('humanitec.sidebar.organization_structure - set organization in workspace', async () => {
    const sidebarController = HumanitecSidebarController.getInstance();

    let availableResourceTypesRefreshed = false;
    let organizationStructureRefreshed = false;
    sidebarController.availableResourceTypesProvider.onDidChangeTreeData(() => {
      availableResourceTypesRefreshed = true;
    });
    sidebarController.organizationStructureProvider.onDidChangeTreeData(() => {
      organizationStructureRefreshed = true;
    });

    await vscode.commands.executeCommand(
      'humanitec.sidebar.organization_structure.set_in_workspace',
      new Organization(humanitecOrg, 'test-org')
    );

    const configs = new ConfigurationRepository();
    await waitForExpect(
      async () => {
        const org = await configs.get(ConfigKey.HUMANITEC_ORG);
        expect(org).to.be.equal(humanitecOrg);
        expect(availableResourceTypesRefreshed).to.be.true;
        expect(organizationStructureRefreshed).to.be.true;
      },
      10000,
      500
    );
  });

  suite('resource graph', () => {
    test('fails without app / env', async () => {
      await vscode.commands.executeCommand(
        'humanitec.sidebar.organization_structure.set_in_workspace',
        new Organization(humanitecOrg, 'test-org')
      );

      await vscode.commands.executeCommand('humanitec.display_resources_graph');

      await waitForExpect(
        () => {
          expect(showErrorMessage).to.have.been.called;
        },
        10000,
        500
      );

      expect(showErrorMessage).to.have.been.calledWith(
        'There is no enough context to process the request. Required context is: Application'
      );
    });

    // TODO: We might want to improve this case.
    test('fails with a not existing app / env', async () => {
      await vscode.commands.executeCommand(
        'humanitec.sidebar.organization_structure.set_in_workspace',
        new Environment(
          'development',
          'Development',
          humanitecOrg,
          'not-found-app'
        )
      );

      await vscode.commands.executeCommand('humanitec.display_resources_graph');

      await waitForExpect(
        () => {
          expect(showErrorMessage).to.have.been.called;
        },
        10000,
        500
      );

      expect(showErrorMessage).to.have.been.calledWith(
        'Unexpected error occurred. Please contact the extension developer'
      );
    });

    // TODO: We might want to improve this case.
    test('fails with a not deployed app / env', async () => {
      await vscode.commands.executeCommand(
        'humanitec.sidebar.organization_structure.set_in_workspace',
        new Environment(
          'development',
          'Development',
          humanitecOrg,
          'not-deployed'
        )
      );

      await vscode.commands.executeCommand('humanitec.display_resources_graph');

      await waitForExpect(
        () => {
          expect(showErrorMessage).to.have.been.called;
        },
        10000,
        500
      );

      expect(showErrorMessage).to.have.been.calledWith(
        'Environment development has no deployments. Deploy application to development environment first.'
      );
    });

    test('works with a deployed app / env', async () => {
      await vscode.commands.executeCommand(
        'humanitec.sidebar.organization_structure.set_in_workspace',
        new Environment('development', 'Development', humanitecOrg, 'deployed')
      );

      await vscode.commands.executeCommand('humanitec.display_resources_graph');

      await waitForExpect(
        () => {
          expect(
            vscode.window.tabGroups.activeTabGroup.activeTab?.label
          ).to.equal('Resources Graph');
        },
        10000,
        500
      );
    });
  });
});
