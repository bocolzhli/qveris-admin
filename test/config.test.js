import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const repoRoot = path.resolve(import.meta.dirname, '..')

const appPath = path.join(repoRoot, 'src', 'App.jsx')

const readApp = async () => readFile(appPath, 'utf8')

test('admin config navigation includes config route', async () => {
  const app = await readApp()
  assert.match(app, /\{\s*label:\s*'Config',\s*path:\s*'\/config'\s*\}/)
  assert.match(app, /path="\/config"/)
})

test('admin config page fetches config list', async () => {
  const app = await readApp()
  assert.match(app, /\/admin\/config/)
})

test('admin config rows use high-contrast text color', async () => {
  const css = await readFile(path.join(repoRoot, 'src', 'App.css'), 'utf8')
  assert.match(css, /\.config-row\s*\{[^}]*color:\s*rgba\(236,\s*244,\s*251,\s*0\.92\)/)
})
