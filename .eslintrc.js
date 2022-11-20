module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: 'tsconfig.json',
      sourceType: 'module',
    },
    plugins: ['@typescript-eslint/eslint-plugin'],
    extends: [
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
      'eslint:recommended',
      'prettier',
    ],
    root: true,
    env: {
      node: true,
      es6: true
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': ['warn'],
      '@typescript-eslint/explicit-member-accessibility': ['error', {
        overrides: {
          constructors: 'no-public',
        }
      }],
      'no-extra-boolean-cast': 0,
      'quotes': 0,
      '@typescript-eslint/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'no-undef': 0,
      'no-prototype-builtins': 0,
      'no-nonoctal-decimal-escape': 0,
      'no-unsafe-optional-chaining': 0,
      'no-unused-vars': 0,
      'require-await': 2,
      'no-return-await': 2,
      'getter-return': 2,
      'no-restricted-imports': ['error', '.'],
    },
    overrides: [{
      files: ['**/*.interface.ts', '**/*.request.ts'],
      rules: {
        '@typescript-eslint/explicit-member-accessibility': ['off']
      }
    }]
  };
  