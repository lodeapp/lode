import { nativeTheme } from 'electron'
import {
    isMacOSMojaveOrLater,
    isWindows10And1809Preview17666OrLater
} from '@lib/helpers/os'

/**
 * The list of available theme names.
 */
export type ThemeName = 'light' | 'dark' | 'system'

/**
 * Whether or not the current OS supports System Theme Changes
 */
export function supportsSystemThemeChanges (): boolean {
    if (__DARWIN__) {
        return isMacOSMojaveOrLater()
    } else if (__WIN32__) {
        // Its technically possible this would still work on prior versions of Windows 10 but 1809
        // was released October 2nd, 2018 and the feature can just be "attained" by upgrading
        // See https://github.com/desktop/desktop/issues/9015 for more
        return isWindows10And1809Preview17666OrLater()
    }

    return false
}

export function initializeTheme (theme: ThemeName): void {
    if (theme !== 'system') {
        nativeTheme.themeSource = theme
    }
}
