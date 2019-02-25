require('electron').app.on('ready', () => {
    require('devtron').install()
    let installExtension = require('electron-devtools-installer')
    installExtension.default(installExtension.VUEJS_DEVTOOLS)
        .then(() => {})
        .catch((err: Error) => {
            console.log('Unable to install `vue-devtools`: \n', err)
    })
})

// Require `main` process to boot app
require('./index')
