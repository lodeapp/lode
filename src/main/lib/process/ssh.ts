import { compact, get } from 'lodash'

export type SSHOptions = {
    host: string
    user?: string | null
    port?: number | null
    identity?: string | null
    path?: string
    options?: {
        BatchMode?: string
        Compression?: string
        DSAAuthentication?: string
        LogLevel?: string
        StrictHostKeyChecking?: string
        UserKnownHostsFile?: string
        ForwardAgent?: string
        IdentitiesOnly?: string
        ControlMaster?: string
        ExitOnForwardFailure?: string
        ConnectTimeout?: number
    }
}

export class SSH {

    protected defaults: SSHOptions = {
        host: '',
        options: {
            BatchMode: 'yes',
            Compression: 'yes',
            DSAAuthentication: 'yes',
            LogLevel: 'FATAL',
            StrictHostKeyChecking: 'no',
            UserKnownHostsFile: '/dev/null',
            ForwardAgent: 'yes',
            IdentitiesOnly: 'yes',
            ControlMaster: 'no',
            ExitOnForwardFailure: 'yes',
            ConnectTimeout: 10
        }
    }

    protected connection?: SSHOptions

    constructor (connection?: SSHOptions) {

        if (!connection) {
            this.connection = this.defaults
        }

        this.connection = {
            ...this.defaults,
            ...connection!,
            // Do a deep merge for options, in case they are
            // partially set on the given connection.
            options: {
                ...this.defaults.options,
                ...connection!.options || {}
            }
        }
    }

    public commandArgs (args: Array<string>): Array<string> {
        console.log(this.connection)
        return [
            '-S none',
            get(this.connection, 'host', '')
        ]
        .concat(Object.keys(this.connection!.options!).map((key: string) => {
            return ['-o', [key, get(this.connection, `options.${key}`)].join('=')].join(' ')
        }))
        .concat(
            [
                compact(['-l', get(this.connection, 'user', '')]),
                compact(['-p', get(this.connection, 'port')]),
                compact(['-i', get(this.connection, 'identity')])
            ]
            .filter(details => details.length > 1)
            .map(details => details.join(' '))
        )
        .concat([
            '-tt',
            // If connection includes a remote path, connect straight into it
            // by preprending the cd comand into our existing remote args.
            '"' + (this.connection!.path ? ['cd ' + this.connection!.path + ' &&'] : []).concat(
                args.map((arg: string) => this.sanitize(arg))
            ).join(' ') + '"'
        ])
    }

    public sanitize (arg: string): string {
        return arg
            .replace(/\b\\\b/g, "'\\\\'")
            .replace(/\b\\\\\b/g, "'\\\\\\\\'")
            .replace(/\b\|\b/g, "'\\\|'")
            .replace(/"/g, "'\"'")
    }
}
