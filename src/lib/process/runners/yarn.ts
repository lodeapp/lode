import { concat } from 'lodash'
import { IProcess, DefaultProcess } from '@lib/process/process'

export class YarnProcess extends DefaultProcess implements IProcess {
    static readonly type: string = 'yarn'

    /**
     * Whether this process owns a given command.
     *
     * @param command The command we're checking to match a Yarn runner.
     */
    public static owns (command: string): boolean {
        return command.toLowerCase().search(/\byarn(\.js|\.cmd)?(?!\.)\b/) > -1
    }

    /**
     * Return the array of arguments with which to spawn the child process.
     * We need to patch the Yarn binary path for Windows environments.
     */
    protected spawnArguments (args: Array<string>): Array<string> {
        if (!args.length) {
            return args
        }

        let binary = args.shift()
        if (this.platform === 'win32' && binary === 'yarn') {
            binary = 'yarn.cmd'
        }

        // Recreate the arguments by prefixing remaining ones with '--'.
        return concat(binary!, args)
    }
}
