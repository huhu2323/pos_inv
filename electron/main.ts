import { app, BrowserWindow, shell } from 'electron'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function isDev(): boolean {
  return Boolean(process.env.VITE_DEV_SERVER_URL)
}

function getIndexHtmlPath(): string {
  return join(__dirname, '..', 'dist', 'index.html')
}

async function createWindow(): Promise<BrowserWindow> {
  const window = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:tofu-pos',
    },
  })

  window.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('blob:')) {
      return { action: 'allow' }
    }

    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      void shell.openExternal(targetUrl)
    }

    return { action: 'deny' }
  })

  window.once('ready-to-show', () => {
    if (!isDev()) {
      window.setFullScreen(true)
    }

    window.show()
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    await window.loadURL(devUrl)
  } else {
    await window.loadFile(getIndexHtmlPath())
  }

  return window
}

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows()
    if (window) {
      if (window.isMinimized()) {
        window.restore()
      }

      if (!isDev()) {
        window.setFullScreen(true)
      }

      window.focus()
      return
    }

    void createWindow()
  })

  app.whenReady().then(() => {
    void createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        void createWindow()
      }
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
