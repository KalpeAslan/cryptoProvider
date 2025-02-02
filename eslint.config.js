module.exports = [
  {
    files: ['**/*.ts'],
    ignores: ['node_modules/**', 'dist/**'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
        ecmaVersion: 2020,
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
      prettier: require('eslint-plugin-prettier'),
    },
    rules: {
      'class-methods-use-this': 'off',
      'import/prefer-default-export': 'off',
      '@typescript-eslint/explicit-function-return-type': 'error',
      'prettier/prettier': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
