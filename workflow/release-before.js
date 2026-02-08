const Path = require('node:path')
const chalk = require('chalk')
const Fs = require('fs-extra')
const builder = require('../electron-builder.js')

const releaseNotesPath = Path.join(__dirname, `../${builder.directories.buildResources}/release-notes.md`)
if (!Fs.existsSync(releaseNotesPath)) {
    console.log(`\n${chalk.bgRed.white(' NO RELEASE NOTES ')} No release notes file found inside the buildResources directory. Please add it and try again.\n`)
    process.exit(1)
}
