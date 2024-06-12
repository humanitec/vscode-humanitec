import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

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
  eslintPluginPrettierRecommended,
  {
    ignores: ['out/', 'dist/', '.vscode-test/'],
  }
);
