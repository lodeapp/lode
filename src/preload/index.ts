import { contextBridge } from 'electron'

import { Lode } from './lode'
import '@lib/logger/preload'

contextBridge.exposeInMainWorld('Lode', Lode)
