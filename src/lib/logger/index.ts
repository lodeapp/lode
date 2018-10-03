import { Debug } from '@lib/logger/debug'
import { Console } from '@lib/logger/console'

const debug = new Debug()
const info = new Console()

export const Logger = {
    debug,
    info
}