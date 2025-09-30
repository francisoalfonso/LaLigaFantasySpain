/**
 * ESLint Configuration - Fantasy La Liga
 * Configuración adaptada para código JavaScript vanilla (no TypeScript)
 */

const prettier = require('eslint-plugin-prettier');

module.exports = [
    {
        files: ['**/*.js'],
        ignores: [
            'node_modules/**',
            'coverage/**',
            'logs/**',
            'output/**',
            'temp/**',
            'dist/**'
        ],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                // Node.js globals
                __dirname: 'readonly',
                __filename: 'readonly',
                Buffer: 'readonly',
                console: 'readonly',
                exports: 'writable',
                global: 'readonly',
                module: 'readonly',
                process: 'readonly',
                require: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                // Jest globals
                describe: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                jest: 'readonly'
            }
        },
        plugins: {
            prettier
        },
        rules: {
            // Prettier integration
            'prettier/prettier': ['error', {
                singleQuote: true,
                semi: true,
                tabWidth: 4,
                trailingComma: 'none',
                printWidth: 100,
                endOfLine: 'lf'
            }],

            // Possible Errors
            'no-console': 'off', // Permitido porque usamos logger
            'no-debugger': 'warn',
            'no-dupe-args': 'error',
            'no-dupe-keys': 'error',
            'no-duplicate-case': 'error',
            'no-empty': 'warn',
            'no-ex-assign': 'error',
            'no-extra-semi': 'error',
            'no-func-assign': 'error',
            'no-irregular-whitespace': 'error',
            'no-unreachable': 'error',
            'use-isnan': 'error',
            'valid-typeof': 'error',

            // Best Practices
            'curly': ['error', 'all'],
            'eqeqeq': ['error', 'always', { null: 'ignore' }],
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-multi-spaces': 'error',
            'no-new-wrappers': 'error',
            'no-return-await': 'error',
            'no-self-compare': 'error',
            'no-throw-literal': 'error',
            'no-unused-expressions': 'warn',
            'no-useless-concat': 'warn',
            'no-useless-return': 'warn',
            'require-await': 'warn',

            // Variables
            'no-delete-var': 'error',
            'no-undef': 'error',
            'no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            'no-use-before-define': ['error', {
                functions: false,
                classes: true,
                variables: true
            }],

            // Stylistic Issues
            'array-bracket-spacing': ['error', 'never'],
            'block-spacing': ['error', 'always'],
            'brace-style': ['error', '1tbs', { allowSingleLine: true }],
            'comma-dangle': ['error', 'never'],
            'comma-spacing': ['error', { before: false, after: true }],
            'comma-style': ['error', 'last'],
            'computed-property-spacing': ['error', 'never'],
            'func-call-spacing': ['error', 'never'],
            'indent': ['error', 4, { SwitchCase: 1 }],
            'key-spacing': ['error', { beforeColon: false, afterColon: true }],
            'keyword-spacing': ['error', { before: true, after: true }],
            'linebreak-style': ['error', 'unix'],
            'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
            'no-trailing-spaces': 'error',
            'object-curly-spacing': ['error', 'always'],
            'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
            'semi': ['error', 'always'],
            'semi-spacing': ['error', { before: false, after: true }],
            'space-before-blocks': ['error', 'always'],
            'space-before-function-paren': ['error', {
                anonymous: 'always',
                named: 'never',
                asyncArrow: 'always'
            }],
            'space-in-parens': ['error', 'never'],
            'space-infix-ops': 'error',
            'space-unary-ops': ['error', { words: true, nonwords: false }],

            // ES6
            'arrow-spacing': ['error', { before: true, after: true }],
            'no-var': 'warn',
            'prefer-const': ['warn', { destructuring: 'all' }],
            'prefer-template': 'warn',
            'template-curly-spacing': ['error', 'never']
        }
    }
];