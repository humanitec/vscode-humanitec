import { execFile, ExecFileException } from 'child_process';
import * as util from 'util';

import { HumctlResult } from './HumctlResult';
import { IHumctlAdapter } from './IHumctlAdapter';
import { IConfigurationRepository } from '../../repos/ConfigurationRepository';
import { ISecretRepository } from '../../repos/SecretRepository';
import { ConfigKey } from '../../domain/ConfigKey';
import { SecretKey } from '../../domain/SecretKey';
import { NotEnoughContextError } from '../../errors/NotEnoughContextError';
import { HumanitecContext } from '../../domain/HumanitecContext';
import { UnauthorizedError } from '../../errors/UnauthorizedError';
import { UnexpectedEmptyOutputError } from '../../errors/UnexpectedEmptyOutputError';
import { UnsupportedOperatingSystemError } from '../../errors/UnsupportedOperatingSystemError';
import path from 'path';
import { ExtensionContext } from 'vscode';
import { NoDeploymentsInEnvironmentError } from '../../errors/NoDeploymentsInEnvironmentError';
import { VsceVersion } from '../../extension';

export class HumctlAdapter implements IHumctlAdapter {
  constructor(
    private configs: IConfigurationRepository,
    private secrets: ISecretRepository,
    private context: ExtensionContext
  ) {}

  async execute(command: string[]): Promise<HumctlResult> {
    const os = process.platform.toString();
    let arch = process.arch.toString();

    if (arch === 'arm') {
      arch = 'arm64';
    }

    if (os !== 'darwin' && os !== 'linux' && os !== 'win32') {
      throw new UnsupportedOperatingSystemError(os, arch);
    }

    if (
      (os === 'win32' && arch !== 'x64') ||
      (arch !== 'x64' && arch !== 'arm64')
    ) {
      throw new UnsupportedOperatingSystemError(os, arch);
    }

    // TODO: upgrade to a later version once https://github.com/humanitec/cli-internal/pull/257/ is merged.
    let humctlEmbeddedBinaryFilename = `cli_0.36.2_${os}_${arch}`;
    if (os === 'win32') {
      humctlEmbeddedBinaryFilename += '.exe';
    }

    const humctlFilePath = this.context.asAbsolutePath(
      path.join('humctl', humctlEmbeddedBinaryFilename)
    );

    let result = {
      stdout: '',
      stderr: '',
    };
    let statusCode = 0;
    try {
      const exec = util.promisify(execFile);
      result = await exec(humctlFilePath, command, {
        env: await this.prepareEnvVars(),
      });
    } catch (error: unknown) {
      const execErr = error as ExecFileException;

      if (execErr.code) {
        if (typeof execErr.code === 'string') {
          statusCode = parseInt(execErr.code, 10);
        } else {
          statusCode = execErr.code;
        }
      }
      result.stderr = execErr.stderr || '';
      result.stdout = execErr.stdout || '';
    }

    // Ensure stderr and stdout is not undefined before its processing
    if (result.stderr === undefined) {
      result.stderr = '';
    }
    if (result.stdout === undefined) {
      result.stdout = '';
    }

    if (
      result.stderr.includes('HTTP-401') ||
      result.stderr.includes('HTTP-403')
    ) {
      throw new UnauthorizedError();
    } else if (
      result.stderr.includes('environment is required') ||
      result.stderr.includes('missing env')
    ) {
      throw new NotEnoughContextError(HumanitecContext.ENV);
    } else if (
      result.stderr.includes('application is required') ||
      result.stderr.includes('missing app')
    ) {
      throw new NotEnoughContextError(HumanitecContext.APP);
    } else if (
      result.stderr.includes('organization is required') ||
      result.stderr.includes('missing org')
    ) {
      throw new NotEnoughContextError(HumanitecContext.ORG);
    } else if (result.stderr.includes('no deployments in environment')) {
      throw new NoDeploymentsInEnvironmentError(
        await this.configs.get(ConfigKey.HUMANITEC_ENV)
      );
    } else if (result.stderr === '' && result.stdout === '') {
      throw new UnexpectedEmptyOutputError(
        humctlEmbeddedBinaryFilename,
        command,
        {
          env: await this.prepareEnvVars(),
        }
      );
    }

    return new HumctlResult(result.stdout, result.stderr, statusCode);
  }

  private async prepareEnvVars(): Promise<NodeJS.ProcessEnv> {
    const token = await this.secrets.get(SecretKey.HUMANITEC_TOKEN);
    const org = await this.configs.get(ConfigKey.HUMANITEC_ORG);
    const app = await this.configs.get(ConfigKey.HUMANITEC_APP);
    const env = await this.configs.get(ConfigKey.HUMANITEC_ENV);

    return {
      ...process.env,
      HUMANITEC_TOKEN: token === '' ? 'not-provided' : token,
      HUMANITEC_ORG: org,
      HUMANITEC_APP: app,
      HUMANITEC_ENV: env,
      HUMANITEC_OUTPUT: 'json',
      HUMANITEC_CLI_ALPHA_FEATURES: '',
      HUMANITEC_OVERRIDE_USER_AGENT: `humanitec-vscode-extension/${VsceVersion}`,
    };
  }
}
