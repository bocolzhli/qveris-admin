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
