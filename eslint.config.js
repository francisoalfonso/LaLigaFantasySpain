/**
 * ESLint Configuration - Fantasy La Liga
 * Configuración adaptada para código JavaScript vanilla (no TypeScript)
 *
 * CRITICAL FIX: Disabled all stylistic rules that conflict with Prettier
 * to prevent circular fixes warning
 */

const prettier = require('eslint-plugin-prettier');

module.exports = [
    {
        files: ['**/*.js'],
        ignores: ['node_modules/**', 'coverage/**', 'logs/**', 'output/**', 'temp/**', 'dist/**'],
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
            // Prettier integration - Prettier config comes from .prettierrc.json
            'prettier/prettier': 'error',

            // Possible Errors
            'no-console': 'off', // Permitido porque usamos logger
            'no-debugger': 'warn',
            'no-dupe-args': 'error',
            'no-dupe-keys': 'error',
            'no-duplicate-case': 'error',
            'no-empty': 'warn',
            'no-ex-assign': 'error',
            'no-func-assign': 'error',
            'no-irregular-whitespace': 'error',
            'no-unreachable': 'error',
            'use-isnan': 'error',
            'valid-typeof': 'error',

            // Best Practices
            curly: ['error', 'all'],
            eqeqeq: ['error', 'always', { null: 'ignore' }],
            'no-eval': 'error',
            'no-implied-eval': 'error',
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
            'no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ],
            'no-use-before-define': [
                'error',
                {
                    functions: false,
                    classes: true,
                    variables: true
                }
            ],

            // ES6
            'no-var': 'warn',
            'prefer-const': ['warn', { destructuring: 'all' }],
            'prefer-template': 'warn'
        }
    }
];
