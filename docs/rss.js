const _ = require('lodash')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const RSS = require('rss')
const markdown = require('markdown-it')

const releases = require('./support/releases.json')

const log = (msg, color = 'blue', label = 'RSS') => {
    console.log(`\n${chalk.reset.inverse.bold[color](` ${label} `)} ${msg}`)
}

const releaseNotesHtml = (notes) => {
    let html = ''
    _.each(notes, (notes, group) => {
        const text = !notes || !notes.length ? `\n${group}\n` : `### ${group}\n\n- ${notes.join("\n- ")}`
        html += markdown({
            breaks: true,
            typographer: true
        }).render(text)
    })
    return html.replace(/\r?\n|\r/g, '')
}

log('Generating feed...')

const feed = new RSS({
    title: 'Lode Releases',
    description: 'The feed for Lode app\'s latest releases',
    generator: 'Lode + VuePress',
    feed_url: 'https://lode.run/rss.xml',
    site_url: 'https://lode.run',
    image_url: 'https://lode.run/favicon.png',
    docs: 'https://lode.run/documentation/',
    managingEditor: 'Tomas Buteler',
    webMaster: 'Tomas Buteler',
    copyright: `Copyright © ${new Date().getFullYear()} - Tomas Buteler`,
    language: 'en-us',
    categories: [
        'Software',
        'Electron',
        'Developer Tools',
        'Unit Testing',
        'Feature Testing',
        'Graphical Interface',
        'Unit Testing GUI',
        'Feature Testing GUI',
        'PHPUnit',
        'Jest'
    ],
    pubDate: new Date()
})

releases.forEach(release => {
    feed.item({
        title: release.version,
        description: releaseNotesHtml(release.notes),
        url: `https://lode.run/release-notes/#${release.version}`,
        guid: `https://lode.run/release-notes/#${release.version}`,
        author: 'Tomas Buteler',
        date: new Date(release.date).toUTCString()
    })
})

fs.writeFileSync(path.resolve('pages/.vuepress/dist', 'rss.xml'), feed.xml({ indent: true }))
log(`created feed with ${feed.items.length} releases`)
