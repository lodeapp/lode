const s = JSON.stringify

module.exports.getReplacements = function () {
  return {
    __DARWIN__: process.platform === 'darwin',
    __WIN32__: process.platform === 'win32',
    __LINUX__: process.platform === 'linux',
    __DEV__: process.env.IS_DEV || false,
    __MIGRATE__: process.env.LODE_MIGRATE !== 'false',
    __LOGGER__: process.env.LOGGER !== 'false',
    'process.platform': s(process.platform),
    'process.env.NODE_ENV': s(process.env.NODE_ENV || 'development'),
    'process.env.TEST_ENV': s(process.env.TEST_ENV),
    __CRASH_URL__: s('https://71e593620d21420fb864d3fe667d8ce6@sentry.io/1476972'),
    __ANALYTICS_ID__: s('UA-103701546-4')
  }
}
