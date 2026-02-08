const Path = require('node:path')
const Fs = require('fs-extra')

Fs.copySync(Path.join(__dirname, '../static'), Path.join(__dirname, '../dist/static'))
