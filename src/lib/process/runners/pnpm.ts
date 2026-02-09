import type { IProcess, IProcessEnvironment } from '@lib/process/process'
import { DefaultProcess } from '@lib/process/process'
import { compact, concat } from 'lodash'

export class PnpmProcess extends DefaultProcess implements IProcess {
    static readonly type: string = 'pnpm'

    /**
     * Whether this process owns a given command.
     *
     * @param command The command we're checking to match a pnpm runner.
     */
    public static owns(command: string): boolean {
        return command.toLowerCase().search(/\bpnpm(\.cmd)? (run|exec)\b/) > -1
    }

    /**
     * Return the array of arguments with which to spawn the child process.
     * Like npm, pnpm requires arguments to be preceded by '--' when using
     * `pnpm run`, so this is where we enforce that syntax. We also need
     * to patch the binary path for Windows environments.
     */
    protected spawnArguments(args: Array<string>): Array<string> {
        if (!args.length) {
            return args
        }

        let binary = args.shift()
        if (this.platform === 'win32' && binary === 'pnpm') {
            binary = 'pnpm.cmd'
        }

        // Capture the subcommand (run or exec).
        const subcommand = args.shift()

        // First argument after the subcommand is our script/executable, so shift it.
        const script = args.shift()

        // Recreate the arguments by prefixing remaining ones with '--'.
        return compact(concat(binary!, subcommand!, (script || ''), args.length ? '--' : '', args))
    }

    /**
     * Return the env object with which to spawn the child process.
     */
    protected spawnEnv(env: IProcessEnvironment): IProcessEnvironment {
        return {
            ...env,
            ...{
                // Disable pnpm update notifier
                NO_UPDATE_NOTIFIER: 1,
            },
        }
    }
}
