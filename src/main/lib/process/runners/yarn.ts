import { IProcess, DefaultProcess } from '@lib/process/process'

export class YarnProcess extends DefaultProcess implements IProcess {

    owns (command: string) {
        return true
    }
}
