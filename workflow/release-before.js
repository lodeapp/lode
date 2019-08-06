const _ = require('lodash')
const Path = require('path')
const Fs = require('fs-extra')
const inquirer = require('inquirer')
const pkg = require('../package.json')
const builder = require('../electron-builder.json')
const chalk = require('chalk')

const releaseNotesPath = Path.join(__dirname, `../${builder.directories.buildResources}/release-notes.md`)
if (!Fs.existsSync(releaseNotesPath)) {
    console.log(`\n${chalk.bgRed.white(' NO RELEASE NOTES ')} No release notes file found inside the buildResources directory. Please add it and try again.\n`)
    process.exit(1)
}

const releaseNotes = String(Fs.readFileSync(releaseNotesPath))
console.log(`\n${chalk.bgBlue.white(' RELEASE NOTES ')} For version ${pkg.version}.\n`)
console.log(releaseNotes)

inquirer.prompt([
    {
        type: 'confirm',
        name: 'releaseNotes',
        message: 'Are the release notes above up-to-date and correct.',
        default: false
    }
]).then(answers => {
    if (!answers.releaseNotes) {
        console.log(`\n${chalk.bgRed.white(' ABORTED ')} Please amend release notes for version ${pkg.version} and try again.\n`)
        process.exit(1)
    }
})
