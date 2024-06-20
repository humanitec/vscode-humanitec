import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { platform } from 'node:process';
import { defineConfig } from '@vscode/test-cli';
import { globSync } from 'glob';

// Workaround https://github.com/microsoft/vscode/issues/86382, but creating a tmp user data dir
const userDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-humanitec-'));

let files = 'out/test/**/*.test.js';

if (platform === 'win32') {
  // Workaround https://github.com/mochajs/mocha/issues/4851
  files = globSync('out/test/**/*.test.js', { absolute: true }).map(f =>
    f.toLowerCase()
  );
}

export default defineConfig([
  {
    label: 'unitTests',
    files,
    workspaceFolder: './src/test/test-fixtures/workspace',
    mocha: {
      ui: 'tdd',
      timeout: 20000,
      asyncOnly: true,
      failZero: true,
    },
    launchArgs: [`--user-data-dir=${userDir}`, '--disable-extensions'],
  },
  // you can specify additional test configurations, too
]);
