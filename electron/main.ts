import { app, BrowserWindow, shell } from 'electron'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { dirname, join, extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
}

let staticServer: Server | null = null

function getDistPath(): string {
  return resolve(__dirname, '..', 'dist')
}

function resolveRequestPath(distPath: string, requestPath: string): string {
  const decoded = decodeURIComponent(requestPath.split('?')[0] ?? '/')
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\//, '')
  const filePath = resolve(distPath, relative)

  if (!filePath.startsWith(distPath + sep)) {
    return join(distPath, 'index.html')
  }

  return filePath
}

async function serveFile(
  distPath: string,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const requestPath = req.url ?? '/'
  let filePath = resolveRequestPath(distPath, requestPath)

  if (!existsSync(filePath)) {
    if (extname(filePath)) {
      res.writeHead(404)
      res.end('Not found')
      return
    }

    filePath = join(distPath, 'index.html')
  }

  const ext = extname(filePath)
  const mime = MIME_TYPES[ext] ?? 'application/octet-stream'
  const content = await readFile(filePath)

  res.writeHead(200, { 'Content-Type': mime })
  res.end(content)
}

function startStaticServer(distPath: string): Promise<string> {
  return new Promise((resolveUrl, reject) => {
    const server = createServer((req, res) => {
      void serveFile(distPath, req, res).catch(() => {
        res.writeHead(500)
        res.end('Internal server error')
      })
    })

    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo
      staticServer = server
      resolveUrl(`http://127.0.0.1:${address.port}`)
    })

    server.on('error', reject)
  })
}

async function createWindow(url: string): Promise<void> {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
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

  await window.loadURL(url)
}

app.whenReady().then(async () => {
  const devUrl = process.env.VITE_DEV_SERVER_URL
  const url = devUrl ?? (await startStaticServer(getDistPath()))
  await createWindow(url)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow(url)
    }
  })
})

app.on('window-all-closed', () => {
  staticServer?.close()
  staticServer = null

  if (process.platform !== 'darwin') {
    app.quit()
  }
})
