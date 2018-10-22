import { IProcess, DefaultProcess } from '@lib/process/process'

export class YarnProcess extends DefaultProcess implements IProcess {

    public filterLines (lines: Array<string>): Array<string> {
        if (this.rawChunks.length > 0) {
            return lines
        }
        return lines.filter(line => {
            return !line.match(/^\$/)
        })
    }

    owns (command: string) {
        return true
    }
}
