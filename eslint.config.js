import jsEslint from '@eslint/js'
import tsEslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'

const jsRueles = jsEslint.configs.recommended.rules
const tsRules = tsEslint.configs.stylisticTypeChecked
  .reduce((a, item) => ((item.rules ? (a = { ...a, ...item.rules }) : a), a), {})

// Пример конфигурации https://typescript-eslint.io/packages/typescript-eslint#advanced-usage
export default tsEslint.config(
  {
    name: 'ts-interface-core',
    files: [
      'src/**/*.{ts,js}',
      'scripts/**/*.{ts,js}',
      'eslint.config.js',
      'vitest.config.ts'
    ],
    languageOptions: {
      // NOTE В одних примерах ecmaVersion/sourceType здесь, в других в parserOptions - не знаю куда лучше положить
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsEslint.parser,
      parserOptions: {
        project: [
          'tsconfig.project.json'
        ]
      }
    },
    plugins: {
      '@typescript-eslint': tsEslint.plugin,
      '@stylistic': stylistic
    },
    rules: {
      ...jsRueles,
      ...tsRules,
      // Это правило `a === b` не установлено в jsEslint.configs.recommended и вероятно во всех плагинах.
      eqeqeq: [
        'error',
        'always'
      ],
      // Правила для JS путают сигнатуры типов(например функций) с реальными, их следует отключить
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_'
      }],
      // Требовать импорта типов как 'import {type Foo} from ...'
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],
      //
      // ## Стиль ##
      //
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }]
    }
  })
