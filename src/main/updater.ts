import { app, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import { applicationMenu } from './menu'

export class Updater {

    protected initialRun: boolean = true
    protected downloading: boolean = false
    protected downloaded: boolean = false

    constructor () {
        autoUpdater.autoDownload = false
        autoUpdater.logger = log
        autoUpdater.checkForUpdates()

        autoUpdater.on('checking-for-update', () => {
            applicationMenu.setOptions({
                isCheckingForUpdate: true
            })
        })

        autoUpdater.on('update-available', (info) => {
            this.downloading = true
            applicationMenu.setOptions({
                isCheckingForUpdate: false,
                isDownloadingUpdate: true
            })
            autoUpdater.downloadUpdate()
        })

        autoUpdater.on('update-not-available', (info) => {
            applicationMenu.setOptions({
                isCheckingForUpdate: false
            })
            if (this.initialRun) {
                this.initialRun = false
                return
            }
            dialog.showMessageBox({
                type: 'info',
                message: 'You’re up-to-date!',
                detail: `Lode ${app.getVersion()} is currently the newest version available.`,
                buttons: ['OK']
            })
        })

        autoUpdater.on('error', (err) => {
            applicationMenu.setOptions({
                isCheckingForUpdate: false
            })
            if (this.initialRun) {
                this.initialRun = false
                return
            }
            dialog.showErrorBox('Update Failed', 'An error occurred while attempting to update Lode, please try again. You may be required to update manually by downloading Lode again.')
        })

        autoUpdater.on('update-downloaded', (info) => {
            this.downloading = false
            this.downloaded = true
            applicationMenu.setOptions({
                isDownloadingUpdate: false,
                hasDownloadedUpdate: true
            })
            dialog.showMessageBox({
                type: 'info',
                message: 'Ready to Install',
                detail: `Lode ${info.version} has been download and is ready to install. You are required to restart the app.`,
                buttons: ['Install and Relaunch', 'Cancel']
            }, (buttonIndex) => {
                if (buttonIndex === 0) {
                    autoUpdater.quitAndInstall()
                }
            })
        })
    }
}
