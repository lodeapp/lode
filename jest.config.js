module.exports = {
    'globalSetup': './tests/setup.js',
    'globals': {
        __DEV__: true,
        __SILENT__: true,
        __WIN32__: process.platform === 'win32',
        __DARWIN__: process.platform === 'darwin',
        __LINUX__: process.platform === 'linux',
        'ts-jest': {
            'babelConfig': true,
            'tsconfig': 'tsconfig.json'
        }
    },
    'setupFiles': [
        './tests/mocks/setup.js'
    ],
    'moduleFileExtensions': [
        'js',
        'ts',
        'json',
        'vue'
    ],
    'moduleNameMapper': {
        '^@/(.*)$': '<rootDir>/src/renderer/$1',
        '^@main/(.*)$': '<rootDir>/src/main/$1',
        '^@lib/(.*)$': '<rootDir>/src/lib/$1'
    },
    'testPathIgnorePatterns':
    [
        '<rootDir>/build/',
        '<rootDir>/dist/',
        '<rootDir>/node_modules/',
        '<rootDir>/src/'
    ],
    'transform': {
        '.*\\.(vue)$': 'vue-jest',
        '^.+\\.(ts)$': 'ts-jest',
        '^.+\\.js$': 'babel-jest'
    },
    'clearMocks': true,
    'collectCoverage': false,
    'collectCoverageFrom': [
        'src/**',
        '!src/styles/**'
    ],
    'coverageDirectory': 'tests/coverage',
    'coverageReporters': ['json', 'html']
}
