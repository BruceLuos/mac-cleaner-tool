import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { clean, getRegistry, scanAll } from './cleanup/controller'
import { cleanupRegistry } from './cleanup/registry'
import { createSettingsStore } from './settings/store'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  const userDataPath = app.getPath('userData')
  const settingsStore = createSettingsStore(
    join(userDataPath, 'settings.json'),
    {
      readFile: async (path) => fs.readFile(path, 'utf8'),
      writeFile: async (path, value) => fs.writeFile(path, value, 'utf8'),
      rename: (from, to) => fs.rename(from, to)
    },
    {
      categories: [...new Set(cleanupRegistry.map((target) => target.category))],
      targetIds: cleanupRegistry.map((target) => target.id)
    }
  )

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Cleanup bridge: registry is white-listed, scan is read-only, clean only
  // ever moves to Trash or runs a registered command — never free-form delete.
  ipcMain.handle('cleanup:registry', () => getRegistry())
  ipcMain.handle('cleanup:scan', () => scanAll())
  ipcMain.handle('cleanup:clean', (_event, targets) => clean(targets))
  ipcMain.handle('settings:get', () => settingsStore.load())
  ipcMain.handle('settings:save', async (_event, settings) => {
    await fs.mkdir(userDataPath, { recursive: true })
    await settingsStore.save(settings)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
