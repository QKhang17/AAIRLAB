import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'

const root = resolve(import.meta.dirname, '../..')
const read = path => readFileSync(resolve(root, path), 'utf8')

test('Home menu closes on Escape and section navigation, and returns keyboard focus', () => {
  const dom = new JSDOM(read('main/HTML/Home/home.html'), {
    url: 'http://localhost/main/HTML/Home/home.html', runScripts: 'outside-only',
  })
  const w = dom.window
  try {
    w.eval(read('main/JavaScript/home.js'))
    const menu = w.document.getElementById('homeMenuToggle')
    menu.click()
    assert.equal(menu.getAttribute('aria-expanded'), 'true')
    menu.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    assert.equal(menu.getAttribute('aria-expanded'), 'false')
    assert.equal(w.document.activeElement, menu)
    menu.click()
    w.document.querySelector('#home-navigation a').click()
    assert.equal(menu.getAttribute('aria-expanded'), 'false')
    assert.ok(!w.document.getElementById('top-nav').classList.contains('is-menu-open'))
  } finally { w.close() }
})

test('Home highlights the current section when scrolling down and back to the hero', () => {
  const dom = new JSDOM(read('main/HTML/Home/home.html'), {
    url: 'http://localhost/main/HTML/Home/home.html', runScripts: 'outside-only',
  })
  const w = dom.window
  let position = 0
  const frames = []
  w.requestAnimationFrame = callback => { frames.push(callback); return frames.length }
  for (const [index, id] of ['features', 'workflow', 'about'].entries()) {
    w.document.getElementById(id).getBoundingClientRect = () => ({ top: 800 * (index + 1) - position })
  }
  try {
    w.eval(read('main/JavaScript/home.js'))
    const currentLink = () => w.document.querySelector('#home-navigation [aria-current="location"]')
    assert.equal(currentLink(), null)
    for (const [offset, target] of [[900, '#features'], [1700, '#workflow'], [2500, '#about'], [900, '#features']]) {
      position = offset
      w.dispatchEvent(new w.Event('scroll'))
      frames.shift()(0)
      assert.equal(currentLink().getAttribute('href'), target)
      assert.equal(w.document.querySelectorAll('#home-navigation [aria-current]').length, 1)
    }
    position = 0
    w.dispatchEvent(new w.Event('scroll'))
    frames.shift()(0)
    assert.equal(currentLink(), null)
  } finally { w.close() }
})

test('comparison view controls reference every result column and switch without losing input', () => {
  const dom = new JSDOM(read('main/HTML/User/ResultAnalysis/Task.html'), { runScripts: 'outside-only' })
  const w = dom.window
  try {
    w.eval(read('main/JavaScript/workspaceViews.js'))
    const controls = [...w.document.querySelectorAll('.comparison-view-switch button')]
    const resultIds = controls[1].getAttribute('aria-controls').split(' ')
    assert.equal(resultIds.length, 2)
    assert.ok(resultIds.every(id => w.document.getElementById(id)))
    const note = w.document.querySelector('textarea')
    note.value = 'Keep this draft'
    controls[0].click()
    assert.equal(w.document.body.dataset.comparisonView, 'pdf')
    assert.equal(controls[0].getAttribute('aria-pressed'), 'true')
    controls[1].click()
    assert.equal(w.document.body.dataset.comparisonView, 'results')
    assert.equal(note.value, 'Keep this draft')
  } finally { w.close() }
})

test('review navigation supplies a mobile menu and returns focus on Escape', async () => {
  const dom = new JSDOM(read('main/HTML/User/ManualReview/Task.html'), {
    url: 'http://localhost/main/HTML/User/ManualReview/Task.html', runScripts: 'outside-only',
  })
  const w = dom.window
  try {
    w.eval(read('main/JavaScript/navbar.js'))
    await w.AAIRNavbar.ready
    const menu = w.document.querySelector('.aair-navbar__menu')
    assert.ok(menu)
    assert.ok(w.document.getElementById(menu.getAttribute('aria-controls')))
    menu.click()
    assert.equal(menu.getAttribute('aria-expanded'), 'true')
    menu.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    assert.equal(menu.getAttribute('aria-expanded'), 'false')
    assert.equal(w.document.activeElement, menu)
    assert.equal(w.document.querySelector('[aria-current="page"]').textContent, 'Review')
  } finally { w.close() }
})

test('completion dialog keeps keyboard focus inside and restores the trigger on Escape', () => {
  const dom = new JSDOM('<button id="submit">Submit</button>', { runScripts: 'outside-only' })
  const w = dom.window
  try {
    w.eval(read('main/JavaScript/sessionCompletion.js'))
    const trigger = w.document.getElementById('submit')
    trigger.focus()
    w.AAIR.SessionCompletion.showMissingDialog([{ fileName: 'Report.pdf', detail: ['Review required'] }])
    const overlay = w.document.querySelector('.session-completion-dialog')
    const close = overlay.querySelector('button')
    assert.equal(w.document.activeElement, close)
    const tab = new w.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    close.dispatchEvent(tab)
    assert.equal(tab.defaultPrevented, true)
    close.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    assert.equal(w.document.querySelector('.session-completion-dialog'), null)
    assert.equal(w.document.activeElement, trigger)
  } finally { w.close() }
})
