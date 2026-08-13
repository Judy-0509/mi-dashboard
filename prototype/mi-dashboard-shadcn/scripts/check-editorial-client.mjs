import assert from "node:assert/strict"
import { createServer } from "node:http"

import {
  EditorialApiError,
  flattenEditorialContent,
  moveItem,
  normalizeEditorialContent,
  requestEditorial,
} from "../src/lib/editorial-model.ts"

assert.deepEqual(moveItem(["a", "b", "c"], 2, -1), ["a", "c", "b"])
assert.deepEqual(moveItem(["a", "b"], 0, -1), ["a", "b"])
assert.deepEqual(moveItem(["a", "b"], 1, 1), ["a", "b"])

assert.deepEqual(
  normalizeEditorialContent("bullets", [" 첫 문장 ", "둘째 문장"]),
  ["첫 문장", "둘째 문장"],
)
assert.deepEqual(
  normalizeEditorialContent("titled", [
    { title: " 제목 ", details: [" 세부 "] },
  ]),
  [{ title: "제목", details: ["세부"] }],
)
assert.deepEqual(
  flattenEditorialContent("titled", [
    { title: "제목", details: ["세부 1", "세부 2"] },
  ]),
  ["제목", "세부 1", "세부 2"],
)
assert.throws(
  () => normalizeEditorialContent("bullets", [""]),
  /1~500자/,
)

const server = createServer((request, response) => {
  response.setHeader("Content-Type", "application/json")
  if (request.url === "/ok") {
    response.end(JSON.stringify({ ok: true }))
    return
  }
  response.statusCode = 409
  response.end(
    JSON.stringify({
      error: "conflict",
      code: "version_conflict",
      latest: { version: 3, draftContent: ["최신본"] },
    }),
  )
})
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
try {
  const address = server.address()
  const root = `http://127.0.0.1:${address.port}`
  assert.deepEqual(await requestEditorial(`${root}/ok`), { ok: true })
  await assert.rejects(
    requestEditorial(`${root}/conflict`, {
      method: "PUT",
      body: { expectedVersion: 1 },
      csrfToken: "token",
    }),
    (error) => {
      assert.ok(error instanceof EditorialApiError)
      assert.equal(error.status, 409)
      assert.equal(error.code, "version_conflict")
      assert.deepEqual(error.latest, {
        version: 3,
        draftContent: ["최신본"],
      })
      return true
    },
  )
} finally {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
}

console.log("editorial client check passed")
