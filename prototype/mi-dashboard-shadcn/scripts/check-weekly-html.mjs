import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path, { basename } from "node:path"
import { buildWeeklyHtml, defaultSiteDir } from "./build-weekly-html.mjs"

const tempDir = mkdtempSync(path.join(os.tmpdir(), "mi-weekly-html-"))

try {
  assert.equal(defaultSiteDir, path.resolve(import.meta.dirname, "../../../site"))

  const siteDir = path.join(tempDir, "site")
  const assetsDir = path.join(siteDir, "assets")
  mkdirSync(assetsDir, { recursive: true })
  writeFileSync(
    path.join(siteDir, "index.html"),
    '<!doctype html>\r\n<html><head><link rel="icon" href="/mi-mark.svg"><link href="https://example.test/icon.svg" rel="icon"><link rel="stylesheet" href="/assets/index-test.css"></head><body><img src="/assets/index-decoy.js"><a href="/assets/index-decoy.css"></a><div id="root"></div><script type="module" src="/assets/index-test.js"></script></body></html>\r\n',
  )
  writeFileSync(path.join(assetsDir, "index-test.js"), 'console.log("</script>$&")')
  writeFileSync(path.join(assetsDir, "index-test.css"), '@font-face { src: url(./test.woff2) } body::before { content: "</style>$&" }')
  writeFileSync(path.join(assetsDir, "test.woff2"), Buffer.from([0, 1, 2, 3]))
  writeFileSync(path.join(siteDir, "mi-mark.svg"), '<svg xmlns="http://www.w3.org/2000/svg"></svg>')

  const outputPath = buildWeeklyHtml({ siteDir })
  const html = readFileSync(outputPath, "utf8")
  const indexHtml = readFileSync(path.join(siteDir, "index.html"), "utf8")
  assert.equal(basename(outputPath), "MI_Weekly_2026W32.html")
  assert.doesNotMatch(indexHtml, /\r/)
  assert.doesNotMatch(html, /\r/)
  assert.match(html, /window\.__MI_WEEKLY_EXPORT__ = true/)
  assert.match(html, /<script type="module">[\s\S]*<\\\/script>/)
  assert.match(html, /console\.log\("<\\\/script>\$&"\)/)
  assert.match(html, /<style>[\s\S]*data:font\/woff2;base64,/)
  assert.match(html, /<style>[\s\S]*<\\\/style>/)
  assert.match(html, /content: "<\\\/style>\$&"/)
  assert.match(html, /href="data:image\/svg\+xml;base64,/)
  assert.doesNotMatch(html, /https:\/\/example\.test\/icon\.svg/)
  assert.doesNotMatch(html, /<script[^>]+\bsrc=/i)
  assert.doesNotMatch(html, /rel=["']stylesheet["']/i)

  const missingJsDir = path.join(tempDir, "missing-js-site")
  mkdirSync(path.join(missingJsDir, "assets"), { recursive: true })
  writeFileSync(
    path.join(missingJsDir, "index.html"),
    '<link rel="stylesheet" href="/assets/index-test.css"><script type="module" src="/assets/index-missing.js"></script>',
  )
  writeFileSync(path.join(missingJsDir, "assets", "index-test.css"), "body {}")
  writeFileSync(path.join(missingJsDir, "mi-mark.svg"), "<svg></svg>")
  assert.throws(() => buildWeeklyHtml({ siteDir: missingJsDir }))
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}
