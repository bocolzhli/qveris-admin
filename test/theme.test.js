import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const repoRoot = path.resolve(import.meta.dirname, '..')

test('admin loads metal-tech fonts', async () => {
  const html = await readFile(path.join(repoRoot, 'index.html'), 'utf8')
  assert.match(html, /Chakra\+Petch/)
  assert.match(html, /IBM\+Plex\+Mono/)
})

test('admin defines metal-tech design tokens', async () => {
  const css = await readFile(path.join(repoRoot, 'src', 'index.css'), 'utf8')
  assert.match(css, /--bg:\s*#05070a/i)
  assert.match(css, /--accent:\s*#e3b85b/i)
  assert.match(css, /--accent-alt:\s*#73f6ff/i)
  assert.match(css, /--font-display:\s*"Chakra Petch"/i)
  assert.match(css, /--font-mono:\s*"IBM Plex Mono"/i)
})

test('admin keeps focus-visible styling', async () => {
  const css = await readFile(path.join(repoRoot, 'src', 'App.css'), 'utf8')
  assert.match(css, /:focus-visible/)
  assert.match(css, /outline:\s*2px solid rgba\(227,\s*184,\s*91/i)
})

