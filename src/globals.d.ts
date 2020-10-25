/* eslint-disable typescript/interface-name-prefix */
/** Is the app running in dev mode? */
declare const __DEV__: boolean

/** Should the app run state migrations? */
declare const __MIGRATE__: boolean

/** Should the app use the logger classes or just output to console? */
declare const __LOGGER__: boolean

/** Is the app being built to run on Darwin? */
declare const __DARWIN__: boolean

/** Is the app being built to run on Win32? */
declare const __WIN32__: boolean

/** Is the app being built to run on Linux? */
declare const __LINUX__: boolean

/** Path to static files */
declare const __static: string

/** URL to send Electron's crash reports to */
declare const __CRASH_URL__: string

/** Lode's Universal Analytics property ID */
declare const __ANALYTICS_ID__: string

/**
 * The currently executing process kind.
 */
declare const __PROCESS_KIND__:
  | 'main'
  | 'renderer'

interface ILogger {
  /**
   * Writes a log message at the 'error' level.
   *
   * The error will be persisted to disk as long as the disk transport is
   * configured to pass along log messages at this level. For more details
   * about the on-disk transport, see log.ts in the main process.
   *
   * If used from a renderer the log message will also be appended to the
   * devtools console.
   *
   * @param message The text to write to the log file
   * @param error   An optional error instance that will be formatted to
   *                include the stack trace (if one is available) and
   *                then appended to the log message.
   */
  error(message: string, error?: Error): void

  /**
   * Writes a log message at the 'warn' level.
   *
   * The error will be persisted to disk as long as the disk transport is
   * configured to pass along log messages at this level. For more details
   * about the on-disk transport, see log.ts in the main process.
   *
   * If used from a renderer the log message will also be appended to the
   * devtools console.
   *
   * @param message The text to write to the log file
   * @param error   An optional error instance that will be formatted to
   *                include the stack trace (if one is available) and
   *                then appended to the log message.
   */
  warn(message: string, error?: Error): void

  /**
   * Writes a log message at the 'info' level.
   *
   * The error will be persisted to disk as long as the disk transport is
   * configured to pass along log messages at this level. For more details
   * about the on-disk transport, see log.ts in the main process.
   *
   * If used from a renderer the log message will also be appended to the
   * devtools console.
   *
   * @param message The text to write to the log file
   * @param error   An optional error instance that will be formatted to
   *                include the stack trace (if one is available) and
   *                then appended to the log message.
   */
  info(message: string, error?: Error): void

  /**
   * Writes a log message at the 'debug' level.
   *
   * The error will be persisted to disk as long as the disk transport is
   * configured to pass along log messages at this level. For more details
   * about the on-disk transport, see log.ts in the main process.
   *
   * If used from a renderer the log message will also be appended to the
   * devtools console.
   *
   * @param message The text to write to the log file
   * @param error   An optional error instance that will be formatted to
   *                include the stack trace (if one is available) and
   *                then appended to the log message.
   */
  debug(message: string, error?: Error): void
}

declare const log: ILogger

interface ITracker {
    screenview (screen: string): void
    event (
      category: string,
      action: string,
      label?: string | null,
      value?: string | null
    ): void
}

declare const track: ITracker

type MenuEvent =
  | 'add-repositories'
  | 'crash'
  | 'feedback'
  | 'filter'
  | 'framework-settings'
  | 'log-project'
  | 'log-renderer-state'
  | 'log-settings'
  | 'new-project'
  | 'open-external-editor'
  | 'open-working-directory'
  | 'project-switch'
  | 'refresh-all'
  | 'refresh-framework'
  | 'remove-framework'
  | 'remove-project'
  | 'rename-project'
  | 'run-all'
  | 'run-framework'
  | 'select-all'
  | 'settings-reset'
  | 'show-about'
  | 'show-preferences'
  | 'stop-all'
  | 'stop-framework'
  | 'repository-manage'
  | 'repository-remove'
  | 'repository-scan'

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
