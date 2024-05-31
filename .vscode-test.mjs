import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { defineConfig } from '@vscode/test-cli';

// Workaround https://github.com/microsoft/vscode/issues/86382, but creating a tmp user data dir
const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-humanitec-'));

export default defineConfig([
  {
    label: 'unitTests',
    files: 'out/test/**/*.test.js',
    workspaceFolder: './src/test/test-fixtures/workspace',
    mocha: {
      ui: 'tdd',
      timeout: 20000,
      asyncOnly: true,
    },
    launchArgs: [`--user-data-dir=${userDir}`],
  },
  // you can specify additional test configurations, too
]);
