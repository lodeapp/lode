const Path = require('path')
const Fs = require('fs-extra')

const distPath = Path.join(__dirname, '../dist')
const electronPath = Path.join(__dirname, '../dist')
Fs.removeSync(Path.join(__dirname, '../static/reporters'))
Fs.removeSync(Path.join(__dirname, '../support/icons'))
Fs.removeSync(Path.join(__dirname, '../src/lib/reporters/phpunit/bootstrap'))
Fs.removeSync(Path.join(__dirname, '../build/mac'))
Fs.removeSync(Path.join(__dirname, '../build/win-unpacked'))
Fs.removeSync(distPath)
Fs.mkdirsSync(distPath)
Fs.mkdirsSync(electronPath)
Fs.closeSync(Fs.openSync(Path.join(electronPath, '.gitkeep'), 'w'))
