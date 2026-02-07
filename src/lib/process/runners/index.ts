import { NpmProcess } from './npm'
import { YarnProcess } from './yarn'

export { YarnProcess }
export { NpmProcess }

export const Runners = [YarnProcess, NpmProcess]
