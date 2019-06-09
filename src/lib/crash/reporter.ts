import * as Sentry from '@sentry/electron'

if (process.env.NODE_ENV !== 'development') {
    Sentry.init({
        dsn: __CRASH_URL__
    })
}
