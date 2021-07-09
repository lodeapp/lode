export function formatError (error: Error, title?: string): string {
    return title
        ? `${title}\n${error.name}: ${error.message}`
        : `${error.name}: ${error.message}`
}

export function formatLogMessage (message: string, error?: Error): string {
    return error ? formatError(error, message) : message
}
