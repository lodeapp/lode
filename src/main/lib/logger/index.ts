import { Debug } from './debug'
import { Console } from './console'

const debug = new Debug()
const info = new Console()

export const Logger = {
    debug,
    info
}
