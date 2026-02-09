import type { IProcess } from '@lib/process/process'
import { DefaultProcess } from '@lib/process/process'
import { concat } from 'lodash'

export class BunProcess extends DefaultProcess implements IProcess {
    static readonly type: string = 'bun'

    /**
     * Whether this process owns a given command.
     *
     * @param command The command we're checking to match a Bun runner.
     */
    public static owns(command: string): boolean {
        return command.toLowerCase().search(/\b(bun(\.exe)? run|bunx(\.exe)?)\b/) > -1
    }

    /**
     * Return the array of arguments with which to spawn the child process.
     * Bun does not need a '--' separator. We patch the binary path for
     * Windows environments where Bun uses a .exe extension.
     */
    protected spawnArguments(args: Array<string>): Array<string> {
        if (!args.length) {
            return args
        }

        let binary = args.shift()
        if (this.platform === 'win32') {
            if (binary === 'bun') {
                binary = 'bun.exe'
            }
            else if (binary === 'bunx') {
                binary = 'bunx.exe'
            }
        }

        return concat(binary!, args)
    }
}
