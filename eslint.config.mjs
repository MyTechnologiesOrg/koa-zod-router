import tsParser from '@typescript-eslint/parser';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      'no-console': 'warn',
    },
  },
  prettierRecommended,
];
