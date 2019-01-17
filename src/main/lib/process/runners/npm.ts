import { IProcess, DefaultProcess } from '@lib/process/process'

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
    protected spawnArguments (): Array<string> {
        return this.args ? ['--'].concat(this.args) : []
    }
}
