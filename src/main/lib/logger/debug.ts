import { Console } from '@lib/logger/console'

export class Debug extends Console {

    public commit (method: string, ...data: Array<any>): void {

        if (!__DEV__) {
            return
        }

        super.commit(method, ...data)
    }
}
