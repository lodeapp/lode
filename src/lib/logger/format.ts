export function formatError (error: Error, title?: string): string {
    return title
        ? `${title}\n${error.name}: ${error.message}`
        : `${error.name}: ${error.message}`
}

export function formatLogMessage (message: string | object, error?: Error): string {
    if (typeof message === 'object') {
        message = JSON.stringify(message)
    }
    return error ? formatError(error, message) : message
}
