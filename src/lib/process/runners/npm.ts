import { compact, concat, drop } from 'lodash'
import { IProcessEnvironment, IProcess, DefaultProcess } from '@lib/process/process'

export class NpmProcess extends DefaultProcess implements IProcess {
    static readonly type: string = 'npm'

    /**
     * Whether this process owns a given command.
     *
     * @param command The command we're checking to match an NPM runner.
     */
    public static owns (command: string) {
        return command.toLowerCase().match(/\bnpm run\b/)
    }

    /**
     * Return the array of arguments with which to spawn the child process.
     * NPM requires arguments to be preceded by '--', so this is where we
     * will enforce that syntax.
     */
    protected spawnArguments (args: Array<string>): Array<string> {
        if (!args.length) {
            return args
        }

        // Drop the first two arguments ("npm" and "run").
        args = drop(args, 2)

        // First argument after npm run is our script, so shift it.
        const script = args.shift()

        // Recreate the arguments by prefixing remaining ones with '--'.
        return compact(concat('npm', 'run', (script || ''), '--', args))
    }

    /**
     * Return the env object with which to spawn the child process.
     */
    protected spawnEnv (env: IProcessEnvironment): IProcessEnvironment {
        return {
            ...env,
            ...{
                // Disable npm update notifier
                NO_UPDATE_NOTIFIER: 1
            }
        }
    }
}
