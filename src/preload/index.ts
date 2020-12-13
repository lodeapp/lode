import '@lib/logger/preload'

import { contextBridge } from 'electron'
import { Lode } from './lode'

contextBridge.exposeInMainWorld('Lode', Lode)
