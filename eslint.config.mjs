import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import tsParser from '@typescript-eslint/parser'
import importX from 'eslint-plugin-import-x'
import solid from 'eslint-plugin-solid/configs/recommended'

const FILES = ['src/**/*.{js,mjs,cjs,jsx,mjsx,ts,mts,tsx,mtsx}']

export default tseslint.config({
  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    solid,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
  ],
  files: FILES,
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: globals.browser,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'import-x/exports-last': 'error',
    'import-x/first': 'error',
    'import-x/group-exports': 'error',
    'import-x/no-unused-modules': 'warn',
    'import-x/no-cycle': 'error',
    'import-x/order': ['error', { 'newlines-between': 'always' }],
  },
  settings: {
    'import-x/resolver': {
      typescript: true,
    },
  },
})

// export default tseslint.config([
//   {
//     ...eslint.configs.recommended,
//     files: FILES,
//   },
//   {
//     ...tseslint.configs.recommended,
//     files: FILES,
//   },
//   // importX.flatConfigs.recommended,
//   // importX.flatConfigs.typescript,
//   {
//     ...solid,
//     files: FILES,
//   },
//   {
//     files: FILES,
//     languageOptions: {
//       parser: tsParser,
//       ecmaVersion: 13,
//       sourceType: 'module',
//       globals: globals.browser,
//     },
//     // rules: {
//     //   // 'import-x/no-unused-modules': 'warn',
//     //   // 'import-x/no-cycle': 'error',
//     //   // 'import-x/exports-last': 'error',
//     //   // 'import-x/first': 'error',
//     //   // 'import-x/order': ['error', { 'newlines-between': 'always' }],
//     // },
//     settings: {
//       'import-x/resolver': {
//         typescript: true,
//       },
//     },
//   },
// ])
