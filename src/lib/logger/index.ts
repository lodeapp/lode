import { Debug } from './debug'
import { Console } from './console'
import { Main } from './main'

const debug = new Debug()
const info = new Console()
const main = new Main()

export const Logger = {
    debug,
    info,
    main
}
