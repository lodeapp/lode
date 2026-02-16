import antfu from '@antfu/eslint-config'

export default antfu(
    {
        type: 'app',
        typescript: true,
        vue: true,
        jsonc: false,
        yaml: false,

        stylistic: {
            indent: 4,
            quotes: 'single',
            semi: false,
        },
        ignores: [
            'build/**',
            'dist/**',
            'static/**',
            'src/lib/reporters/**',
            'src/lib/process/debug/**',
            'src/types/**',
            'tests/playwright/**',
        ],
    },
    {
        languageOptions: {
            globals: {
                __ANALYTICS_ID__: 'readonly',
                __CRASH_URL__: 'readonly',
                __DARWIN__: 'readonly',
                __DEV__: 'readonly',
                __LINUX__: 'readonly',
                __LOGGER__: 'readonly',
                __SILENT__: 'readonly',
                __static: 'readonly',
                __WIN32__: 'readonly',
                Buffer: 'readonly',
                Electron: 'readonly',
                ILogger: 'readonly',
                ITracker: 'readonly',
                Lode: 'readonly',
                log: 'readonly',
                MenuEvent: 'readonly',
                NodeJS: 'readonly',
                track: 'readonly',
                afterAll: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                beforeEach: 'readonly',
                context: 'readonly',
                describe: 'readonly',
                expect: 'readonly',
                it: 'readonly',
                test: 'readonly',
                vi: 'readonly',
            },
        },
    },
    {
        rules: {
            'no-console': 'off',
            'node/prefer-global/process': 'off',
            'vue/no-v-html': 'off',
            'unused-imports/no-unused-vars': ['error', {
                vars: 'all',
                args: 'none',
                caughtErrors: 'none',
                varsIgnorePattern: '^_',
            }],
            'ts/no-unused-vars': 'off',
            'no-unused-vars': 'off',
            'ts/no-require-imports': 'off',
            'ts/no-empty-function': 'off',
            'ts/no-inferrable-types': 'off',
            curly: ['error', 'all'],
            'style/quote-props': ['error', 'as-needed'],
        },
    },
    {
        files: ['**/*.vue'],
        rules: {
            'vue/html-indent': ['error', 4],
            'vue/html-self-closing': ['error', {
                html: { void: 'never', normal: 'any', component: 'always' },
                svg: 'always',
                math: 'always',
            }],
        },
    },
    {
        files: ['**/*.js'],
        rules: {
            'no-undef': 'error',
        },
    },
)
