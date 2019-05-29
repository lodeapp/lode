// See: https://medium.com/@TwitterArchiveEraser/notarize-electron-apps-7a5f988406db

const fs = require('fs')
const path = require('path')
const builder = require('../electron-builder.json')
const electron_notarize = require('electron-notarize')

module.exports = async function (params) {
    // Only notarize the app on Mac OS only.
    if (process.platform !== 'darwin') {
        return
    }
    let appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`)
    if (!fs.existsSync(appPath)) {
        throw new Error(`Cannot find application at: ${appPath}`)
    }

    console.log(`Notarizing ${builder.appId} found at ${appPath}`)

    try {
        await electron_notarize.notarize({
            appBundleId: builder.appId,
            appPath: appPath,
            appleId: 'tbuteler@me.com',
            appleIdPassword: `@keychain:AC_PASSWORD`
        })
    } catch (error) {
        console.error(error)
    }

    console.log(`Done notarizing ${builder.appId}`)
}
