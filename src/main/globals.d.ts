/* eslint-disable typescript/interface-name-prefix */
/** Is the app running in dev mode? */
declare const __DEV__: boolean

/** Is the app being built to run on Darwin? */
declare const __DARWIN__: boolean

/** Is the app being built to run on Win32? */
declare const __WIN32__: boolean

/** Is the app being built to run on Linux? */
declare const __LINUX__: boolean

declare namespace Electron {
    interface MenuItem {
        readonly accelerator?: Electron.Accelerator
        readonly submenu?: Electron.Menu
        readonly role?: string
        readonly type: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio'
    }

    interface RequestOptions {
        readonly method: string
        readonly url: string
        readonly headers: any
    }

    type AppleActionOnDoubleClickPref = 'Maximize' | 'Minimize' | 'None'

    interface SystemPreferences {
        getUserDefault(
            key: 'AppleActionOnDoubleClick',
            type: 'string'
        ): AppleActionOnDoubleClickPref
    }

    interface WebviewTag extends HTMLElement {
        // Copied from https://github.com/electron/electron-typescript-definitions/pull/81
        // until we can upgrade to a version of Electron which includes the fix.
        addEventListener<K extends keyof HTMLElementEventMap>(
            type: K,
            listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
            useCapture?: boolean
        ): void
        addEventListener(
            type: string,
            listener: EventListenerOrEventListenerObject,
            useCapture?: boolean
        ): void
        removeEventListener<K extends keyof HTMLElementEventMap>(
            type: K,
        listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
            useCapture?: boolean
        ): void
        removeEventListener(
            type: string,
            listener: EventListenerOrEventListenerObject,
            useCapture?: boolean
        ): void
    }
}
