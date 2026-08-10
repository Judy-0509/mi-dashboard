import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const escapeInlineScript = (value) => value.replaceAll("</script", "<\\/script")
const escapeInlineStyle = (value) => value.replaceAll("</style", "<\\/style")
const normalizeLineEndings = (value) => value.replace(/\r\n?/g, "\n")
const normalizeIndexHtml = (value) => normalizeLineEndings(value).replace(/\n[ \t]*\n([ \t]*<\/body>)/, "\n$1")
export const defaultSiteDir = path.resolve(import.meta.dirname, "../../../site")

const readAsset = (siteDir, html, tagName, attribute, extension) => {
  const entryAttribute = `\\b${attribute}=["']([^"']*assets/index-[^"']+\\.${extension})["']`
  const matcher = new RegExp(
    tagName === "script"
      ? `<script\\b(?=[^>]*\\btype=["']module["'])(?=[^>]*${entryAttribute})[^>]*>`
      : `<link\\b(?=[^>]*\\brel=["']stylesheet["'])(?=[^>]*${entryAttribute})[^>]*>`,
    "gi",
  )
  const matches = [...html.matchAll(matcher)]
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one assets/index-*.${extension} ${attribute} attribute`)
  }

  const assetUrl = matches[0][1]
  if (!/^(?:\.\/|\/)?assets\/index-[^/]+\.[a-z0-9]+$/i.test(assetUrl)) {
    throw new Error(`Invalid local ${extension} asset: ${assetUrl}`)
  }

  const assetPath = path.resolve(siteDir, assetUrl.replace(/^\.?\//, ""))
  return { assetPath, tag: matches[0][0] }
}

export function buildWeeklyHtml({ siteDir, outputName = "MI_Weekly_2026W32.html" }) {
  const resolvedSiteDir = path.resolve(siteDir)
  const indexPath = path.join(resolvedSiteDir, "index.html")
  let html = normalizeIndexHtml(readFileSync(indexPath, "utf8"))
  assert.doesNotMatch(html, /\r/, "site/index.html must use LF")
  writeFileSync(indexPath, html)
  const js = readAsset(resolvedSiteDir, html, "script", "src", "js")
  const css = readAsset(resolvedSiteDir, html, "link", "href", "css")
  const jsSource = escapeInlineScript(readFileSync(js.assetPath, "utf8"))
  const cssDir = path.dirname(css.assetPath)
  const cssSource = escapeInlineStyle(readFileSync(css.assetPath, "utf8")).replace(
    /url\((["']?)(\.\/[^)'"\s]+\.woff2)\1\)/gi,
    (_, _quote, fontUrl) => `url(data:font/woff2;base64,${readFileSync(path.resolve(cssDir, fontUrl), "base64")})`,
  )
  const icon = Buffer.from(normalizeLineEndings(readFileSync(path.join(resolvedSiteDir, "mi-mark.svg"), "utf8"))).toString("base64")
  let iconCount = 0
  html = html.replace(/<link\b(?=[^>]*\brel=["']icon["'])[^>]*>/gi, (iconTag) => {
    iconCount += 1
    if (!/\bhref=(["'])[^"']*\1/i.test(iconTag)) {
      throw new Error("Expected every favicon link to have an href")
    }
    return iconTag.replace(/\bhref=(["'])[^"']*\1/i, `href="data:image/svg+xml;base64,${icon}"`)
  })
  if (iconCount === 0) {
    throw new Error("Expected a favicon link")
  }

  html = html.replace(css.tag, () => `<style>${cssSource}</style>`)
  html = html.replace(
    js.tag,
    () =>
      '<script>window.__MI_WEEKLY_EXPORT__ = true; window.location.hash = "#weekly";</script>' +
      `<script type="module">${jsSource}</script>`,
  )
  assert.doesNotMatch(html, /<script[^>]+\bsrc=/i)
  assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet["']/i)
  assert.doesNotMatch(html, /<link\b(?=[^>]*\brel=["']icon["'])(?=[^>]*\bhref=["'](?!data:))[^>]*>/i)
  assert.doesNotMatch(html, /url\(["']?(?!data:)[^)]+\.woff2/i)

  const outputPath = path.join(resolvedSiteDir, outputName)
  html = normalizeLineEndings(html)
  assert.doesNotMatch(html, /\r/, `${outputName} must use LF`)
  writeFileSync(outputPath, html)
  return outputPath
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(buildWeeklyHtml({ siteDir: defaultSiteDir }))
}
