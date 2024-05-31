import * as vscode from 'vscode';

export interface ILoggerService {
  debug(msg: string): void;
  info(msg: string): void;
  warning(msg: string): void;
  error(msg: string): void;
}

export class LoggerService implements ILoggerService {
  constructor(private out: vscode.OutputChannel) {}

  debug(msg: string): void {
    this.out.appendLine('[DEBUG] ' + msg);
  }
  info(msg: string): void {
    this.out.appendLine('[INFO] ' + msg);
  }
  warning(msg: string): void {
    this.out.appendLine('[WARNING] ' + msg);
  }
  error(msg: string): void {
    this.out.appendLine('[ERROR] ' + msg);
  }
}
