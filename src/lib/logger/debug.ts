import { Console } from '@lib/logger/console'

export class Debug extends Console {

    public commit (method: string, ...data: Array<any>): void {

        if (process.env.NODE_ENV !== 'development') {
            return
        }

        super.commit(method, ...data)
    }
}