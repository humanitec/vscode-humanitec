import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: 'vscode',
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {},
    files: ['src/**/*.ts'],
  },
  {
    name: 'vscode-test',
    rules: {
      // Chai uses assertions like `to.be.ok` that trigger this rule.
      '@typescript-eslint/no-unused-expressions': 'off',
    },
    files: ['src/test/**/*.test.ts'],
  },
  {
    name: 'scripts',
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // scripts are plain js
      '@typescript-eslint/no-require-imports': 'off',
    },
    files: ['scripts/*.js'],
  },
  eslintPluginPrettierRecommended,
  {
    ignores: [
      'out/',
      'dist/',
      '.vscode-test/',
      'webview/resource-dependency-graph/dist/',
    ],
  }
);
