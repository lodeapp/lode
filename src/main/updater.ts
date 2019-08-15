import { app, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import { applicationMenu } from './menu'

export class Updater {

    protected startup: boolean = true
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
            applicationMenu.setOptions({
                isCheckingForUpdate: false
            })

            // If this is the startup run and an update is available,
            // just download it without prompting.
            if (this.startup) {
                this.startup = false
                this.download()
                return
            }

            // If check for update was user-initiated, prompt to confirm download.
            dialog.showMessageBox({
                type: 'info',
                message: 'A new version of Lode is available',
                detail: `Lode ${info.version} is now available — you have ${app.getVersion()}. Would you like to download it now?`,
                buttons: ['Download Update', 'Cancel']
            }).then(({ response }) => {
                if (response === 0) {
                    this.download()
                }
            })
        })

        autoUpdater.on('update-not-available', (info) => {
            applicationMenu.setOptions({
                isCheckingForUpdate: false
            })
            if (this.startup) {
                this.startup = false
                return
            }

            dialog.showMessageBox({
                type: 'info',
                message: 'You’re up-to-date!',
                detail: `Lode ${app.getVersion()} is currently the newest version available.`,
                buttons: ['OK']
            }).then(({ response }) => {
                console.log(response)
            })
        })

        autoUpdater.on('error', (err) => {
            console.log({ err })
            applicationMenu.setOptions({
                isCheckingForUpdate: false
            })
            if (this.startup) {
                this.startup = false
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
            }).then(({ response }) => {
                if (response === 0) {
                    autoUpdater.quitAndInstall()
                }
            })
        })
    }

    protected download (): void {
        this.downloading = true
        applicationMenu.setOptions({
            isDownloadingUpdate: true
        })
        autoUpdater.downloadUpdate()
    }
}
