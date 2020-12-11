const _ = require('lodash')
const Path = require('path')
const Fs = require('fs-extra')
const checker = require('license-checker')
const chalk = require('chalk')
const parseAuthor = require('parse-author')

const addendum = {
    // Packages to add manually, which might not come up as dependencies.
    packages: [
        {
            id: 'desktop@1.6.1',
            repository: 'https://github.com/desktop/desktop',
            override: 'MIT'
        },
        {
            id: 'electron@2.0.8',
            repository: 'https://github.com/electron/electron',
            override: 'MIT'
        },
        {
            id: 'bugsnag/bugsnag-php@3.16.0',
            repository: 'https://github.com/bugsnag/bugsnag-php',
            override: 'MIT'
        }
    ],
    // Package license information, in case it's missing.
    licenses: {
        'cycle@1.0.3': 'Public domain',
        'file-stream-rotator@0.3.1': 'MIT',
        'latinize@0.4.1': 'BSD',
        'json-schema@0.2.3': 'BSD'
    },
    // Author information for copyright notices, in case we don't have the
    // actual license text and need to generate it on-the-fly.
    authors: {
        'latinize@0.4.1': 'Jakub Dundalek <dundalek@gmail.com> (http://dundalek.com/)',
        'json-schema@0.2.3': 'Kris Zyp',
        'desktop@1.6.1': 'GitHub, Inc',
        'electron@2.0.8': 'GitHub, Inc'
    }
}

const getLicenseContent = (license, author = '', organization = '') => {

    const authorObj = parseAuthor(author || 'Software contributors')

    const licensesContent = {
        'MIT': `The MIT License (MIT)\n\nCopyright (c) ::author::\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in\nall copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\nTHE SOFTWARE.\n`,
        'BSD': `Copyright (c) ::year::, ::author.name::\n\nAll rights reserved.\n\nRedistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\n* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.\n* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.\n* Neither the name of the organization ::organization:: nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL ::AUTHOR.NAME:: BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
        'BSD-2-Clause': `Copyright ::year:: ::author.name::\n\nRedistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\n\n1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.\n\n2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,
        'BSD-3-Clause': `Copyright (c) ::year::, ::author.name::\n\nAll rights reserved.\n\nRedistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:\n\n* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.\n\n* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.\n\n* Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`
    }

    return _.get(licensesContent, license, '')
        .replace(new RegExp('::year::', 'g'), (new Date()).getFullYear())
        .replace(new RegExp('::author::', 'g'), author)
        .replace(new RegExp('::author.name::', 'g'), authorObj.name)
        .replace(new RegExp('::AUTHOR.NAME::', 'g'), authorObj.name.toUpperCase())
        .replace(new RegExp('::organization::', 'g'), organization)
        .replace(new RegExp('::ORGANIZATION::', 'g'), organization.toUpperCase())
}

console.log(`${chalk.bgBlue.white(' LICENSES ')} Parsing and writing dependencies' licenses`)

checker.init({
    start: Path.resolve(__dirname, '../'),
    production: true
}, (err, data) => {

    data = Object.keys(data).map(id => {
        return Object.assign({ id }, data[id])
    })

    // Create a slimmer packages object with minimal information.
    let packages = data.map(package => {

        // Reduce parsed licenses object optimistically. We'll later iterate
        // through this list to check whether or not it's been properly populated
        // and adjust accordingly.
        package.license = package.licenseFile && package.licenseFile.match(/license/i) ? Fs.readFileSync(package.licenseFile).toString() : ''

        return package
    })

    // Append manually added packages
    packages = packages.concat(addendum.packages)

    // Verify that all production packages have license content, and remove
    // any that may not be required to be in this list (i.e. empty packages
    // from deeply nested dependencies).
    packages = packages.filter((package, index) => {

        // Exclude our own license from the final file.
        if (package.id.startsWith('Lode@')) {
            return false
        }

        if (!package.license) {

            // Abandoned packages get an NPM security holder URL; ignore these.
            if (package.repository === 'https://github.com/npm/security-holder') {
                return false
            }

            // Have we identified this package's license manually? If not, as a
            // last resort, attempt to parse the package's package.json in case
            // there is more information there about its licensing.
            const licenseOverride = package.override || _.get(addendum.licenses || {}, package.id, package.licenses)

            if (_.isArray(licenseOverride)) {
                throw new Error(`Multiple licenses available for ${package.id}). Please override license explicitly with one of the following: ${licenseOverride.join(', ')}`)
            }

            if (licenseOverride) {

                // If it's public domain, skip
                if (licenseOverride.search(/^public(.)?domain$/i) > -1) {
                    return false
                }

                // If it's another license which just wasn't machine-parseable,
                // we can try to add the content now. If that fails, it's an
                // unconventional license and a warning must be raised. But
                // since we need to create a full copyright license, we must
                // also include the author.
                packages[index].license = getLicenseContent(
                    licenseOverride,
                    _.get(addendum.authors || {}, package.id),
                    _.get(addendum.organizations || {}, package.id)
                )
                if (!packages[index].license) {
                    throw new Error(`Unkown license ${licenseOverride} for ${package.id})`)
                }

                return true
            }

            throw new Error(`License information missing for ${package.id})`)
        }

        return true
    })

    // If all goes well, write the object to file, without directory information.
    const file = Path.join(__dirname, '../static/licenses.json')
    Fs.writeFileSync(file, JSON.stringify(
        _.sortBy(packages.map(package => _.pick(package, ['id', 'repository', 'license'])), 'id'),
        null,
        2
    ))

    console.log(`${chalk.bgBlue.white(' LICENSES ')} Licenses written to ${file}`)
})

if (!Fs.existsSync(Path.join(__dirname, '../static/reporters'))) {
    console.log(`${chalk.bgBlue.white(' LICENSES ')} Reporters not built. Aborting license injection.`)
    return
}

// Copy Lode's license into each reporter package that might get
// placed inside remote machines during runs.
Fs.readdirSync(Path.join(__dirname, '../static/reporters'))
    .map(name => Path.join(__dirname, '../static/reporters', name))
    .filter(source => Fs.lstatSync(source).isDirectory())
    .forEach(reporter => Fs.copySync(Path.join(__dirname, '../static/LICENSE'), Path.join(reporter, 'LICENSE')))
