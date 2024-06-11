import * as vscode from 'vscode';
import { ValidateScoreFileController } from './controllers/ValidateScoreFileController';
import { ConfigurationRepository } from './repos/ConfigurationRepository';
import { SecretRepository } from './repos/SecretRepository';
import { SetTokenController } from './controllers/SetTokenController';
import { ScoreValidationService } from './services/ScoreValidationService';
import { HumanitecSidebarController } from './controllers/HumanitecSidebarController';
import { ResourceTypeRepository } from './repos/ResourceTypeRepository';
import { InitializeScoreFileController } from './controllers/InitializeScoreFileController';
import { ScoreInitializationService } from './services/ScoreInitializationService';
import { DisplayResourcesGraphController } from './controllers/DisplayResourceDependencyGraphController';
import { ResourcesGraphService } from './services/ResourcesGraphService';
import { OpenConfiguredTerminalController } from './controllers/OpenConfiguredTerminalController';
import { LoggerService } from './services/LoggerService';
import { OrganizationRepository } from './repos/OrganizationRepository';
import { ApplicationRepository } from './repos/ApplicationRepository';
import { EnvironmentRepository } from './repos/EnvironmentRepository';
import { HumctlAdapter } from './adapters/humctl/HumctlAdapter';
import { LoginController } from './controllers/LoginController';
import { LoginService } from './services/LoginService';

export const loggerChannel = vscode.window.createOutputChannel('Humanitec');

export async function activate(context: vscode.ExtensionContext) {
  const logger = new LoggerService(loggerChannel);
  const configurationRepository = new ConfigurationRepository();
  const secretRepository = new SecretRepository();
  const humctl = new HumctlAdapter(
    configurationRepository,
    secretRepository,
    context
  );
  const resourceTypeRepository = new ResourceTypeRepository(humctl);
  const organizationRepository = new OrganizationRepository(humctl);
  const applicationRepository = new ApplicationRepository(humctl);
  const environmentRepository = new EnvironmentRepository(humctl);
  const loginService = new LoginService();

  HumanitecSidebarController.register(
    context,
    resourceTypeRepository,
    organizationRepository,
    applicationRepository,
    environmentRepository,
    configurationRepository,
    logger
  );

  LoginController.register(context, loginService, secretRepository, logger);
  SetTokenController.register(context, secretRepository, logger);

  ValidateScoreFileController.register(
    context,
    new ScoreValidationService(humctl),
    configurationRepository,
    logger
  );
  InitializeScoreFileController.register(
    context,
    new ScoreInitializationService(humctl),
    false,
    logger
  );
  DisplayResourcesGraphController.register(
    context,
    new ResourcesGraphService(humctl),
    logger
  );
  OpenConfiguredTerminalController.register(
    context,
    configurationRepository,
    secretRepository,
    logger
  );

  vscode.commands.executeCommand('humanitec.score.validate');
  logger.info('Congratulations, your extension "humanitec" is now active!');
}

// This method is called when your extension is deactivated
export function deactivate() {
  loggerChannel.dispose();
}
