/** Is the app running in dev mode? */
declare const __DEV__: boolean

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

/**
 * The currently executing process kind.
 */
declare const __PROCESS_KIND__:
  | 'main'
  | 'renderer'

/**
 * Lode's custom Electron API for the renderer process.
 */
declare const Lode: any

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
  debug(message: string | object, error?: Error): void
}

declare const log: ILogger

type MenuEvent =
  | 'crash'
  | 'feedback'
  | 'filter'
  | 'framework-remove'
  | 'log-project'
  | 'log-renderer-state'
  | 'log-settings'
  | 'project-add'
  | 'project-edit'
  | 'project-remove'
  | 'project-switch'
  | 'repository-add'
  | 'repository-manage'
  | 'repository-remove'
  | 'repository-scan'
  | 'select-all'
  | 'settings-reset'
  | 'show-about'
  | 'show-preferences'
