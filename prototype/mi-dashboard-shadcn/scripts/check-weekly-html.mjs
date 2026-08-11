import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path, { basename } from "node:path"
import {
  buildAllPageHtml,
  buildPageHtml,
  defaultSiteDir,
  pageExportTargets,
} from "./build-weekly-html.mjs"

const tempDir = mkdtempSync(path.join(os.tmpdir(), "mi-page-html-"))

try {
  assert.equal(defaultSiteDir, path.resolve(import.meta.dirname, "../../../site"))

  const siteDir = path.join(tempDir, "site")
  const assetsDir = path.join(siteDir, "assets")
  const indexSource =
    '<!doctype html>\r\n<html><head><link rel="icon" href="/mi-mark.svg"><link href="https://example.test/icon.svg" rel="icon"><link rel="stylesheet" href="/assets/index-test.css"></head><body><img src="/assets/index-decoy.js"><a href="/assets/index-decoy.css"></a><div id="root"></div><script type="module" src="/assets/index-test.js"></script></body></html>\r\n'
  const iconSource = '<svg>\r\n  <path />\r\n</svg>\r\n'
  mkdirSync(assetsDir, { recursive: true })
  writeFileSync(path.join(siteDir, "index.html"), indexSource)
  writeFileSync(path.join(assetsDir, "index-test.js"), 'console.log("</script>$&")')
  writeFileSync(path.join(assetsDir, "index-test.css"), '@font-face { src: url(./test.woff2) } body::before { content: "</style>$&" }')
  writeFileSync(path.join(assetsDir, "test.woff2"), Buffer.from([0, 1, 2, 3]))
  writeFileSync(path.join(siteDir, "mi-mark.svg"), iconSource)

  const outputPath = buildPageHtml({ siteDir, page: "weekly" })
  const html = readFileSync(outputPath, "utf8")
  assert.equal(basename(outputPath), "MI_Weekly_2026W32.html")
  assert.doesNotMatch(readFileSync(path.join(siteDir, "index.html"), "utf8"), /\r/)
  assert.doesNotMatch(html, /\r/)
  assert.match(html, /window\.__MI_EXPORT_PAGE__ = "weekly"/)
  assert.match(html, /window\.location\.hash = "#weekly"/)
  assert.match(html, /<script type="module">[\s\S]*<\\\/script>/)
  assert.match(html, /console\.log\("<\\\/script>\$&"\)/)
  assert.match(html, /<style>[\s\S]*data:font\/woff2;base64,/)
  assert.match(html, /<style>[\s\S]*<\\\/style>/)
  assert.match(html, /content: "<\\\/style>\$&"/)
  assert.match(html, /href="data:image\/svg\+xml;base64,/)
  assert.doesNotMatch(html, /https:\/\/example\.test\/icon\.svg/)
  assert.doesNotMatch(html, /<script[^>]+\bsrc=/i)
  assert.doesNotMatch(html, /rel=["']stylesheet["']/i)
  assert.doesNotMatch(html, /<aside\b/i)

  const outputPaths = buildAllPageHtml({ siteDir })
  assert.deepEqual(
    outputPaths.map((item) => basename(item)),
    pageExportTargets.map(({ outputName }) => outputName),
  )
  for (const target of pageExportTargets) {
    const targetHtml = readFileSync(path.join(siteDir, target.outputName), "utf8")
    assert.match(targetHtml, new RegExp(`window\\.__MI_EXPORT_PAGE__ = "${target.page}"`))
    assert.match(targetHtml, new RegExp(`window\\.location\\.hash = "${target.hash}"`))
    assert.doesNotMatch(targetHtml, /<script[^>]+\bsrc=/i)
    assert.doesNotMatch(targetHtml, /<link[^>]+rel=["']stylesheet["']/i)
    assert.doesNotMatch(targetHtml, /url\(["']?(?!data:)[^)]+\.woff2/i)
  }

  const missingJsDir = path.join(tempDir, "missing-js-site")
  mkdirSync(path.join(missingJsDir, "assets"), { recursive: true })
  writeFileSync(
    path.join(missingJsDir, "index.html"),
    '<link rel="stylesheet" href="/assets/index-test.css"><script type="module" src="/assets/index-missing.js"></script>',
  )
  writeFileSync(path.join(missingJsDir, "assets", "index-test.css"), "body {}")
  writeFileSync(path.join(missingJsDir, "mi-mark.svg"), "<svg></svg>")
  assert.throws(() => buildPageHtml({ siteDir: missingJsDir, page: "weekly" }))
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}
