import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const escapeInlineScript = (value) => value.replaceAll("</script", "<\\/script")
const escapeInlineStyle = (value) => value.replaceAll("</style", "<\\/style")

const readAsset = (siteDir, html, attribute, extension) => {
  const matcher = new RegExp(`<[^>]+\\b${attribute}=["']([^"']*assets/index-[^"']+\\.${extension})["'][^>]*>`, "gi")
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
  let html = readFileSync(path.join(resolvedSiteDir, "index.html"), "utf8")
  const js = readAsset(resolvedSiteDir, html, "src", "js")
  const css = readAsset(resolvedSiteDir, html, "href", "css")
  const jsSource = escapeInlineScript(readFileSync(js.assetPath, "utf8"))
  const cssDir = path.dirname(css.assetPath)
  const cssSource = escapeInlineStyle(readFileSync(css.assetPath, "utf8")).replace(
    /url\((["']?)(\.\/[^)'"\s]+\.woff2)\1\)/gi,
    (_, _quote, fontUrl) => `url(data:font/woff2;base64,${readFileSync(path.resolve(cssDir, fontUrl), "base64")})`,
  )
  const icon = Buffer.from(readFileSync(path.join(resolvedSiteDir, "mi-mark.svg"))).toString("base64")
  const iconTag = html.match(/<link\b[^>]*\brel=["']icon["'][^>]*>/i)?.[0]
  if (!iconTag) {
    throw new Error("Expected a favicon link")
  }

  html = html.replace(css.tag, `<style>${cssSource}</style>`)
  html = html.replace(
    js.tag,
    '<script>window.__MI_WEEKLY_EXPORT__ = true; window.location.hash = "#weekly";</script>' +
      `<script type="module">${jsSource}</script>`,
  )
  html = html.replace(iconTag, iconTag.replace(/\bhref=(["'])[^"']*\1/i, `href="data:image/svg+xml;base64,${icon}"`))

  assert.doesNotMatch(html, /<script[^>]+\bsrc=/i)
  assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet["']/i)
  assert.doesNotMatch(html, /<link[^>]+rel=["']icon["'][^>]+href=["'](?!data:)/i)
  assert.doesNotMatch(html, /url\(["']?(?!data:)[^)]+\.woff2/i)

  const outputPath = path.join(resolvedSiteDir, outputName)
  writeFileSync(outputPath, html)
  return outputPath
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(buildWeeklyHtml({ siteDir: path.resolve(import.meta.dirname, "../../site") }))
}
