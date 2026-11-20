import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'

const root = resolve(import.meta.dirname, '../..')
const source = readFileSync(resolve(root, 'main/JavaScript/api.js'), 'utf8')

test('an API 401 clears the session and redirects to login', async () => {
  const dom = new JSDOM('', { url: 'http://localhost:5173/main/HTML/User/AILabeling/Task.html', runScripts: 'outside-only' })
  const w = dom.window
  w.Headers = Headers
  w.sessionStorage.setItem('aair_user', JSON.stringify({ id: 1, role: 'AI_LABELER' }))
  w.fetch = async () => ({ ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) })
  w.eval(source)

  await assert.rejects(w.AAIR.request('/documents/1/file', { blob: true }), /Unauthorized/)
  assert.equal(w.sessionStorage.getItem('aair_user'), null)
  dom.window.close()
})

test('API requests use browser-managed cookies and never attach a bearer token', async () => {
  const dom = new JSDOM('', { url: 'http://localhost:5173/main/HTML/User/AILabeling/Task.html?id=4', runScripts: 'outside-only' })
  const w = dom.window
  w.Headers = Headers
  w.document.cookie = 'XSRF-TOKEN=csrf-token'
  let capturedInit
  w.fetch = async (_url, init) => {
    capturedInit = init
    return { ok: true, status: 200, json: async () => ({ success: true, data: { ok: true } }) }
  }
  w.eval(source)

  await w.AAIR.request('/tasks/4/run-ai', { method: 'POST', json: { provider: 'Gemini' } })
  assert.equal(capturedInit.credentials, 'include')
  assert.equal(capturedInit.headers.get('Authorization'), null)
  assert.equal(capturedInit.headers.get('X-XSRF-TOKEN'), 'csrf-token')
  dom.window.close()
})

test('a suppressed API 401 still clears no token because tokens are not stored in web storage', async () => {
  const dom = new JSDOM('', { url: 'http://localhost:5173/main/HTML/User/ResultAnalysis/Task.html', runScripts: 'outside-only' })
  const w = dom.window
  w.Headers = Headers
  w.sessionStorage.setItem('aair_user', JSON.stringify({ id: 1, role: 'RESULT_ANALYST' }))
  w.fetch = async () => ({ ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) })
  w.eval(source)

  await assert.rejects(w.AAIR.request('/tasks/7/ai-results', { suppressAuthRedirect: true }), /Unauthorized/)
  assert.deepEqual(JSON.parse(w.sessionStorage.getItem('aair_user')), { id: 1, role: 'RESULT_ANALYST' })
  dom.window.close()
})

test('API client restores the page session from the HttpOnly cookie', async () => {
  const dom = new JSDOM('', { url: 'http://localhost:5173/main/HTML/User/AILabeling/Prompt.html', runScripts: 'outside-only' })
  const w = dom.window
  w.Headers = Headers
  w.fetch = async (_url, init) => {
    assert.equal(init.credentials, 'include')
    assert.equal(init.headers.get('Authorization'), null)
    return { ok: true, status: 200, json: async () => ({ success: true, data: { id: 1, username: 'yes', role: 'AI_LABELER' } }) }
  }
  w.eval(source)

  const user = await w.AAIR.guard()
  assert.equal(user.role, 'AI_LABELER')
  assert.equal(w.sessionStorage.getItem('aair_access_token'), null)
  dom.window.close()
})

test('guard does not trust a cached user when the cookie session is unavailable', async () => {
  const dom = new JSDOM('', { url: 'http://localhost:5173/main/HTML/User/AILabeling/Task.html?id=4', runScripts: 'outside-only' })
  const w = dom.window
  w.Headers = Headers
  w.localStorage.setItem('aair_user', JSON.stringify({ id: 4, username: 'ai_labeler01', role: 'AI_LABELER' }))
  let requests = 0
  w.fetch = async () => { requests += 1; return { ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) } }
  w.eval(source)

  const user = await w.AAIR.guard()
  assert.equal(user, null)
  assert.equal(requests, 1)
  assert.equal(w.sessionStorage.getItem('aair_user'), null)
  dom.window.close()
})

test('cached user cannot bypass the role directory check', async () => {
  const dom = new JSDOM('', { url: 'http://localhost:5173/main/HTML/User/AILabeling/Task.html?id=4', runScripts: 'outside-only' })
  const w = dom.window
  w.Headers = Headers
  w.localStorage.setItem('aair_user', JSON.stringify({ id: 7, username: 'reviewer01', role: 'REVIEWER' }))
  w.fetch = async (_url, init) => {
    assert.equal(init.credentials, 'include')
    assert.equal(init.headers.get('Authorization'), null)
    return { ok: true, status: 200, json: async () => ({ success: true, data: { id: 7, username: 'reviewer01', role: 'REVIEWER' } }) }
  }
  w.eval(source)

  const user = await w.AAIR.guard()
  assert.equal(user, null)
  assert.equal(w.sessionStorage.getItem('aair_user'), null)
  dom.window.close()
})
