const Path = require('path')
const Fs = require('fs-extra')

const buildPath = Path.join(__dirname, '../build')
Fs.removeSync(buildPath)
Fs.mkdirsSync(buildPath)
