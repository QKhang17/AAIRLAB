import { defineConfig, loadEnv } from 'vite'
import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontend = dirname(fileURLToPath(import.meta.url))
const root = resolve(frontend, '..')
const home = '/main/HTML/Home/home.html'
function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? htmlFiles(path) : entry.name.endsWith('.html') ? [path] : []
  })
}

const cspHash = value => `'sha256-${createHash('sha256').update(value).digest('base64')}'`
function sourceInlineHashes() {
  const hashes = new Set()
  for (const file of htmlFiles(resolve(root, 'main/HTML'))) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)) hashes.add(cspHash(match[1]))
    for (const match of source.matchAll(/\bon[a-z-]+\s*=\s*(["'])([\s\S]*?)\1/gi)) hashes.add(cspHash(match[2]))
  }
  return [...hashes]
}

function securityPolicy(apiBase) {
  const apiOrigin = new URL(apiBase, 'http://localhost:5173').origin
  const inlineConfig = `window.AAIR_API_BASE_URL=${JSON.stringify(apiBase).replace(/</g, '\\u003c')};`
  const hashes = [...sourceInlineHashes(), cspHash(inlineConfig)]
  const scriptSources = ["'self'", "'unsafe-hashes'", ...hashes, 'https://cdn.tailwindcss.com', 'https://cdnjs.cloudflare.com']
  const connectSources = ["'self'", ...(apiBase.startsWith('http://') || apiBase.startsWith('https://') ? [apiOrigin] : [])]
  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    `connect-src ${connectSources.join(' ')}`,
    "worker-src 'self' blob: https://cdnjs.cloudflare.com",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}

export default defineConfig(({ mode }) => {
  const apiBase = loadEnv(mode, frontend, 'VITE_').VITE_API_BASE_URL || '/api'
  const contentSecurityPolicy = securityPolicy(apiBase)
  const securityHeaders = {
    'Content-Security-Policy-Report-Only': contentSecurityPolicy,
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  }
  return {
    root,
    publicDir: false,
    server: {
      port: 5173,
      strictPort: true,
      proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } },
    },
    build: {
      outDir: resolve(frontend, 'dist'),
      emptyOutDir: true,
      rollupOptions: { input: htmlFiles(resolve(root, 'main/HTML')) },
    },
    plugins: [{
      name: 'aair-original-html',
      transformIndexHtml() {
        const inlineConfig = `window.AAIR_API_BASE_URL=${JSON.stringify(apiBase).replace(/</g, '\\u003c')};`
        return [{ tag: 'script', children: inlineConfig, injectTo: 'head-prepend' }]
      },
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          for (const [name, value] of Object.entries(securityHeaders)) res.setHeader(name, value)
          if (req.url === '/' || req.url === '/index.html') {
            res.writeHead(302, { Location: home }); res.end(); return
          }
          next()
        })
      },
      closeBundle() {
        const output = resolve(frontend, 'dist')
        for (const directory of ['main/JavaScript', 'main/Style', 'resource']) {
          cpSync(resolve(root, directory), resolve(output, directory), { recursive: true })
        }
        mkdirSync(output, { recursive: true })
        writeFileSync(resolve(output, 'index.html'), `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${home}"><a href="${home}">AAIR</a>`)
        writeFileSync(resolve(output, '_headers'), `/*\n  Content-Security-Policy-Report-Only: ${contentSecurityPolicy}\n  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`)
      },
    }],
  }
})
