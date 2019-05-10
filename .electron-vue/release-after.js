const pkg = require('../package.json')
const chalk = require('chalk')

console.log(`\n${chalk.bgBlue.white(' RELEASE DONE ')}`)
console.log('Please remember to tag and publish this release:')
console.log(`git tag v${pkg.version}`)
console.log(`git push origin refs/tags/v${pkg.version}\n`)
