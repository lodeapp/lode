// Prepare the Vuepress environment for a build by
// importing the necessary assets from the Lode app.

const _ = require('lodash')
const Path = require('path')
const Fs = require('fs-extra')
const Https = require('follow-redirects').https
const childProcess = require('child_process')
const yaml = require('js-yaml')

const termsPath = Path.join(__dirname, 'pages/terms/')
const supportPath = Path.join(__dirname, 'support/')
const releaseNotesPath = Path.join(__dirname, 'pages/release-notes/')

// Create directories if they not exist yet.
childProcess.exec('mkdir -p ' + termsPath)
childProcess.exec('mkdir -p ' + supportPath)
childProcess.exec('mkdir -p ' + releaseNotesPath)

const pkg = JSON.parse(Fs.readFileSync(Path.join(__dirname, '../package.json')))
const currentVersion = pkg.version

// Import terms and conditions.
const terms = Fs.readFileSync(Path.join(__dirname, '../static/LICENSE'))
const termsFrontMatter = `
---
navbar: false
sidebar: false
layout: Simple
pageClass: legal terms-and-conditions
title: Terms and Conditions
---

<!---
NOTE: THIS FILE IS GENERATED, DO NOT EDIT.
-->

# Lode Application Terms and Conditions
`
Fs.writeFileSync(Path.join(termsPath, 'README.md'), [termsFrontMatter.trim(), terms].join('\n\n'))

// Now we'll import releases from server in order to build our
// release notes page and link to the appropriate files for download.

// Read the current releases file
const releasesFile = Path.join(supportPath, 'releases.json')
const releases = JSON.parse(Fs.readFileSync(releasesFile))

const remotePath = (file) => {
    return `https://github.com/lodeapp/lode/releases/download/v${currentVersion}/${file}`
}

const updateReleases = (release) => {
    if (!_.find(releases, ['version', release.version])) {
        const regex = /^(New:|Changed:|Fixed:|Removed:|\s{1,4}-.+)$/gm
        // Replace hash symbols with a custom signifier, otherwise our issue
        // links will be interpreted as YAML comments and stripped out.
        const escape = (string) => {
            return string
                .replace(/\#(\d+)/gm, ':HASH$1')
                .replace(/\`/gm, ':BACKTICK')
        }
        const notes = yaml.safeLoad(release.releaseNotes.match(regex).map(escape).join('\n'), 'utf8')
        notes.Notes = [escape(release.releaseNotes.replace(regex, '').trim())]

        releases.unshift({
            version: release.version,
            date: release.releaseDate || new Date(),
            notes
        })
    }
    // Write the updated releases file, truncating after 30 entries. If you ever
    // need to check previous releases, check the website's git history.
    Fs.writeFileSync(
        releasesFile,
        JSON.stringify(_.take(releases, 30), null, 2)
            .replace(/\:BACKTICK/gm, '`')
            .replace(/\:HASH(\d+)/gm, '#$1')
    )
}

// Get macOS latest version
Https.get(remotePath('latest-mac.yml')).on('response', response => {
    // If version is still unreleased, skip updating the JSON.
    if (response.statusCode === 404) {
        return
    }
    let body = ''
    response.on('data', chunk => {
        body += chunk
    })
    response.on('end', () => {
        let release = yaml.safeLoad(body, 'utf8') || {}
        release = _.pick({
            ...release,
            path: remotePath(release.files.reduce((previous, current) => {
                return current.url
            }, ''))
        }, ['version', 'path', 'releaseDate', 'releaseNotes'])

        Fs.writeFileSync(Path.join(supportPath, 'latest-mac.json'), JSON.stringify(release, null, 2))
        updateReleases(release)
    })
})
