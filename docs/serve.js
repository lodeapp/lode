const connect = require('connect')
const serveStatic = require('serve-static')
const fs = require('fs')

if (!fs.existsSync(`${__dirname}/pages/.vuepress/dist`)) {
    console.log('\x1b[33m%s\x1b[0m', 'Please compile docs with `yarn docs:build` before running.')
} else {
    connect().use(serveStatic(`${__dirname}/pages/.vuepress/dist`)).listen(8080, function () {
        console.log('\x1b[36m%s\x1b[0m', 'Compiled documentation can be viewed on http://localhost:8080')
    })
}

