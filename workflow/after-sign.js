const Path = require('path')
const { execSync } = require('child_process')
const builder = require('../electron-builder.json')
const notarize = require('electron-notarize')

module.exports = async function (params) {
    if (params.electronPlatformName !== 'darwin') {
        return
    }

    const appPath = Path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`)

    // Verify code signing
    console.log(`Verifying code signing:`)
    execSync(`codesign -v -vvv ${appPath}`, { stdio: 'inherit' })

    // Notarize, unless explicitly skipped
    if (process.env.NOTARIZE !== 'false') {
        console.log(`Starting notarization of ${builder.appId}.`)

        try {
            await notarize.notarize({
                appBundleId: builder.appId,
                appPath,
                appleId: process.env.APPLE_ID,
                appleIdPassword: process.env.APPLE_ID_PASSWORD
            })
        } catch (error) {
            console.error(error)
            process.exit(1)
        }

        console.log(`Finished notarization of ${builder.appId}.`)
        console.log(`Verifying notarization:`)
        execSync(`spctl -a -vv ${appPath}`, { stdio: 'inherit' })
    }
}
