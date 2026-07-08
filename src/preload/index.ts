import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

import type {
  CleanupExecutionResult,
  CleanupExecutionTarget,
  CleanupTargetDefinition,
  ScanResult
} from '../shared/cleanup-types'

/** Narrow, typed surface the renderer is allowed to call. No raw filesystem access leaks through. */
const macCleaner = {
  getRegistry: (): Promise<CleanupTargetDefinition[]> => ipcRenderer.invoke('cleanup:registry'),
  scan: (): Promise<ScanResult[]> => ipcRenderer.invoke('cleanup:scan'),
  cleanSelected: (targets: CleanupExecutionTarget[]): Promise<CleanupExecutionResult[]> =>
    ipcRenderer.invoke('cleanup:clean', targets)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('macCleaner', macCleaner)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.macCleaner = macCleaner
}
