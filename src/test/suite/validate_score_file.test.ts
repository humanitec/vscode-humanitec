import * as vscode from 'vscode';
import { suite, beforeEach, before, afterEach, test } from 'mocha';
import sinon from 'sinon';
import path from 'path';
import waitForExpect from 'wait-for-expect';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import { readEnv } from '../utils';

const expect = chai.expect;
chai.use(sinonChai);

suite('When validate score file command triggered', () => {
  const statusBarItemShow = sinon.spy();
  const statusBarItemHide = sinon.spy();
  const humanitecOrg = readEnv('TEST_HUMANITEC_ORG');
  const humanitecToken = readEnv('TEST_HUMANITEC_TOKEN');

  let sandbox: sinon.SinonSandbox;
  let statusBarItem: vscode.StatusBarItem;
  let workspaceFolder: string;
  let doc: vscode.TextDocument;
  let errorMessageShow: sinon.SinonStub;

  const createFakeStatusBarItem = () => {
    const fakeItem = {
      id: 'id',
      alignment: vscode.StatusBarAlignment.Right,
      priority: undefined,
      name: undefined,
      text: 'text',
      tooltip: undefined,
      color: undefined,
      backgroundColor: undefined,
      command: undefined,
      accessibilityInformation: undefined,
      show: statusBarItemShow,
      hide: statusBarItemHide,
      dispose: sinon.spy(),
    };
    statusBarItem = fakeItem;
    return fakeItem;
  };

  before(async () => {
    if (!vscode.workspace.workspaceFolders) {
      throw new Error('Workspace folder not found');
    }
    workspaceFolder = vscode.workspace.workspaceFolders[0].uri.path;

    const ext = vscode.extensions.getExtension('humanitec.humanitec');
    if (!ext) {
      throw new Error('Extension not found');
    }
    await ext.activate();

    doc = await vscode.workspace.openTextDocument(
      path.join(workspaceFolder, './score.yaml')
    );
    //await vscode.window.showTextDocument(doc);
  });

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
    sandbox
      .stub(vscode.window, 'createStatusBarItem')
      .callsFake(createFakeStatusBarItem);
    errorMessageShow = sandbox
      .stub(vscode.window, 'showErrorMessage')
      .callsFake(
        (message, ...items): Thenable<vscode.MessageItem | undefined> => {
          console.log('showErrorMessage', message, ...items);
          return Promise.resolve(undefined);
        }
      );
  });

  afterEach(() => {
    sandbox.restore();
  });

  test('given user is not logged, should validate the Score files locally', async () => {
    sandbox.stub(vscode.window, 'showInputBox').resolves('');
    await vscode.commands.executeCommand('humanitec.set_token');

    await vscode.workspace
      .getConfiguration('humanitec')
      .update('organization', '');

    await vscode.commands.executeCommand('humanitec.score.validate');

    await waitForExpect(() => {
      const diagnostics = vscode.languages.getDiagnostics(doc.uri);
      expect(diagnostics).not.to.be.empty;
      expect(statusBarItemShow).to.have.been.called;
      expect(statusBarItem.text).to.be.eq('$(warning) Only local validation');
      expect(statusBarItem.tooltip).to.be.eq(
        'There is no organization set so Humanitec Extension could only validate the Score files locally'
      );
    });
  });

  test('given user is logged, but workspace has no organization in use, should validate the Score files locally', async () => {
    sandbox.stub(vscode.window, 'showInputBox').resolves(humanitecToken);
    await vscode.commands.executeCommand('humanitec.set_token');

    await vscode.workspace
      .getConfiguration('humanitec')
      .update('organization', '');

    await vscode.commands.executeCommand('humanitec.score.validate');

    await waitForExpect(() => {
      const diagnostics = vscode.languages.getDiagnostics(doc.uri);
      expect(diagnostics).not.to.be.empty;
      expect(statusBarItemShow).to.have.been.called;
      expect(statusBarItem.text).to.be.eq('$(warning) Only local validation');
      expect(statusBarItem.tooltip).to.be.eq(
        'There is no organization set so Humanitec Extension could only validate the Score files locally'
      );
    });
  });

  test('given user is logged and workspace has valid organization in use, should validate the Score files remotely', async () => {
    await vscode.workspace
      .getConfiguration('humanitec')
      .update('organization', humanitecOrg);

    await vscode.commands.executeCommand('humanitec.score.validate');

    await waitForExpect(() => {
      const diagnostics = vscode.languages.getDiagnostics(doc.uri);
      expect(diagnostics).not.to.be.empty;
      const messages = diagnostics.map(diagnostic => diagnostic.message);
      expect(messages).to.contain.any.members([
        `additionalProperties 'invalid' not allowed`,
      ]);
      expect(statusBarItemHide.called).to.be.true;
    });
  });

  test('given user is logged and workspace has invalid organization in use, should validate the Score files remotely', async () => {
    await vscode.workspace
      .getConfiguration('humanitec')
      .update('organization', 'invalid');

    await vscode.commands.executeCommand('humanitec.score.validate');

    await waitForExpect(() => {
      expect(errorMessageShow).to.have.been.calledWith(
        'Invalid or empty Humanitec token. Login to Humanitec using "Humanitec: Login" or set your token using "Humanitec: Set token" command.'
      );
    });
  });
});
