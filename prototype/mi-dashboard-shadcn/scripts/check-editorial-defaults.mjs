import assert from "node:assert/strict"
import { readFile, readdir } from "node:fs/promises"
import path from "node:path"

import {
  createEditorialManifest,
  createRevision,
  getEditorialDefaultSources,
  repositoryRoot,
  validateEditorialManifest,
} from "./build-editorial-defaults.mjs"

const expectedPageKeys = [
  "sigma",
  "weekly",
  "ani",
  "sell-through",
  "flagship-sales",
  "pipeline-check",
  "pipeline-check-iphone",
  "latest-results",
  "latest-results-iphone",
  "mi-insight",
  "mi-weekly-sell-through",
]

assert.equal(
  createRevision({ b: 2, a: 1 }),
  createRevision({ a: 1, b: 2 }),
  "object key order must not change a revision",
)
assert.notEqual(
  createRevision({ a: 1 }),
  createRevision({ a: 2 }),
  "changed data must change a revision",
)

const sources = getEditorialDefaultSources()
const manifest = createEditorialManifest(sources)
validateEditorialManifest(manifest)
assert.deepEqual(Object.keys(manifest.pages).sort(), expectedPageKeys.sort())
assert.match(manifest.pages.sigma.dataRevision, /^sha256:[0-9a-f]{64}$/)
assert.equal(manifest.pages.sigma.kind, "bullets")
assert.equal(manifest.pages["mi-insight"].kind, "titled")
assert.equal(manifest.pages["mi-weekly-sell-through"].kind, "regional")
assert.deepEqual(
  Object.keys(manifest.pages["mi-weekly-sell-through"].content),
  ["Total", "USA", "China", "Japan", "Europe", "India"],
)

const changedSources = structuredClone(sources)
changedSources.ani.revisionData = { changed: true }
const changedManifest = createEditorialManifest(changedSources)
for (const page of expectedPageKeys) {
  assert.equal(
    changedManifest.pages[page].dataRevision !== manifest.pages[page].dataRevision,
    page === "ani",
    `only ani revision may change, got ${page}`,
  )
}

const generatedPath = path.join(repositoryRoot, "editorial-defaults.json")
const generated = JSON.parse(await readFile(generatedPath, "utf8"))
assert.deepEqual(generated, manifest, "tracked editorial manifest is stale")

if (process.argv.includes("--built-site")) {
  const siteRoot = path.join(repositoryRoot, "site")
  const siteFiles = (await readdir(siteRoot, { recursive: true }))
    .filter((name) => /\.(?:html|js)$/i.test(name))
  const siteText = (
    await Promise.all(
      siteFiles.map((name) => readFile(path.join(siteRoot, name), "utf8")),
    )
  ).join("\n")
  for (const page of expectedPageKeys) {
    const content = manifest.pages[page].content
    const sentences =
      Array.isArray(content)
        ? content.flatMap((item) =>
            typeof item === "string" ? [item] : [item.title, ...item.details],
          )
        : Object.values(content).flat()
    for (const sentence of sentences) {
      assert.equal(
        siteText.includes(sentence),
        false,
        `private default leaked into site bundle: ${page}`,
      )
    }
  }
}

console.log("editorial defaults check passed")
