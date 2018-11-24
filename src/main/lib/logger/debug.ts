import { Console } from './console'

export class Debug extends Console {

    protected commit (method: string, ...data: Array<any>): void {

        if (!__DEV__) {
            return
        }

        super.commit(method, ...data)
    }
}
