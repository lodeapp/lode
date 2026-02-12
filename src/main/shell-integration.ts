import { execFile } from 'node:child_process'
import * as Fs from 'node:fs'
import * as Path from 'node:path'
import { dialog } from 'electron'

const SYMLINK_PATH = '/usr/local/bin/lode'

/**
 * Get the path to the Lode binary inside the app bundle.
 */
function getBinaryPath(): string {
    return process.execPath
}

/**
 * Check if the CLI tool is already installed and points to the current binary.
 */
export function isInstalled(): boolean {
    if (!__DARWIN__) {
        return false
    }

    try {
        const target = Fs.readlinkSync(SYMLINK_PATH)
        return target === getBinaryPath()
    }
    catch {
        return false
    }
}

/**
 * Install the CLI tool by creating a symlink at /usr/local/bin/lode.
 * On macOS, requests administrator privileges if needed.
 */
export async function install(): Promise<boolean> {
    if (!__DARWIN__) {
        log.info('CLI tool installation is currently only supported on macOS.')
        return false
    }

    const binaryPath = getBinaryPath()

    // Ensure /usr/local/bin exists
    const targetDir = Path.dirname(SYMLINK_PATH)
    if (!Fs.existsSync(targetDir)) {
        log.error(`Directory ${targetDir} does not exist.`)
        return false
    }

    // Try creating symlink directly (works if user has write access)
    try {
        // Remove existing symlink if present
        try {
            Fs.unlinkSync(SYMLINK_PATH)
        }
        catch {
            // File doesn't exist, that's fine
        }
        Fs.symlinkSync(binaryPath, SYMLINK_PATH)
        return true
    }
    catch {
        // Permission denied — escalate with osascript
    }

    // Request admin privileges via macOS native dialog
    return new Promise<boolean>((resolve) => {
        const escapedSource = binaryPath.replace(/'/g, '\'\\\'\'')
        const escapedTarget = SYMLINK_PATH.replace(/'/g, '\'\\\'\'')
        const script = `do shell script "ln -sf '${escapedSource}' '${escapedTarget}'" with administrator privileges`

        execFile('osascript', ['-e', script], (error) => {
            if (error) {
                log.error('Failed to install CLI tool with administrator privileges.', error)
                resolve(false)
            }
            else {
                resolve(true)
            }
        })
    })
}

/**
 * Show the appropriate dialog and install the CLI tool.
 */
export async function installWithDialog(): Promise<void> {
    if (isInstalled()) {
        dialog.showMessageBox({
            type: 'info',
            message: 'Command Line Tool Already Installed',
            detail: `The "lode" command is already available at ${SYMLINK_PATH}.`,
            buttons: ['OK'],
        })
        return
    }

    const success = await install()
    if (success) {
        dialog.showMessageBox({
            type: 'info',
            message: 'Command Line Tool Installed',
            detail: `The "lode" command is now available in your terminal.\n\nRun "lode help" to see available commands.`,
            buttons: ['OK'],
        })
    }
    else {
        dialog.showMessageBox({
            type: 'error',
            message: 'Installation Failed',
            detail: `Could not create a symlink at ${SYMLINK_PATH}. You can create it manually:\n\nln -sf "${getBinaryPath()}" ${SYMLINK_PATH}`,
            buttons: ['OK'],
        })
    }
}
