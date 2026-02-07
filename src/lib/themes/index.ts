import { nativeTheme } from 'electron'

/**
 * The list of available theme names.
 */
export type ThemeName = 'light' | 'dark' | 'system'

/**
 * Whether or not the current OS supports System Theme Changes
 */
export function supportsSystemThemeChanges(): boolean {
    return __DARWIN__ || __WIN32__
}

export function initializeTheme(theme: ThemeName): void {
    if (theme !== 'system') {
        nativeTheme.themeSource = theme
    }
}
