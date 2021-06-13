import { app } from 'electron'

app.whenReady().then(() => {
    // @TODO: install Vue Devtools when they are compatible again with Electron 10
    // const installExtension = require('electron-devtools-installer')
    // installExtension(installExtension.VUEJS_DEVTOOLS)
    //     .then(() => {})
    //     .catch((err: Error) => {
    //         console.log('Unable to install `vue-devtools`: \n', err)
    // })
})

// Require `main` process to boot app
require('./index')
