const Path = require('path')
const Fs = require('fs-extra')

Fs.copySync(Path.join(__dirname, '../static/icons'), Path.join(__dirname, '../build/icons'))
Fs.copySync(Path.join(__dirname, '../static/icons'), Path.join(__dirname, '../support/icons'))
