import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"

import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"

const appRoot = path.resolve(import.meta.dirname, "..")
const tempRoot = path.join(appRoot, ".tmp")
await mkdir(tempRoot, { recursive: true })
const temp = await mkdtemp(path.join(tempRoot, "editorial-ui-"))
try {
  const source = await readFile(
    path.join(appRoot, "src", "components", "editor-access-panel.tsx"),
    "utf8",
  )
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2023,
    },
  }).outputText
  const modulePath = path.join(temp, "editor-access-panel.mjs")
  await writeFile(modulePath, compiled, "utf8")
  const { EditorAccessPanel, EditorSessionControls } = await import(
    pathToFileURL(modulePath)
  )
  const baseProps = {
    busy: false,
    error: null,
    onCancel() {},
    async onSubmit() {},
  }
  const setup = renderToStaticMarkup(
    React.createElement(EditorAccessPanel, { ...baseProps, mode: "setup" }),
  )
  assert.match(setup, /최초 편집 비밀번호 설정/)
  assert.doesNotMatch(setup, /name="name"/)
  assert.match(setup, /name="password"/)

  const login = renderToStaticMarkup(
    React.createElement(EditorAccessPanel, { ...baseProps, mode: "login" }),
  )
  assert.match(login, /편집 모드 로그인/)
  assert.match(login, /name="name"/)
  assert.match(login, /name="password"/)

  const change = renderToStaticMarkup(
    React.createElement(EditorAccessPanel, {
      ...baseProps,
      mode: "password",
      error: "실패 메시지",
    }),
  )
  assert.match(change, /공용 비밀번호 변경/)
  assert.match(change, /실패 메시지/)

  const publicControls = renderToStaticMarkup(
    React.createElement(EditorSessionControls, {
      authenticated: false,
      canChangePassword: false,
      editorName: null,
      loading: false,
      setupRequired: true,
      onLogout() {},
      onOpen() {},
    }),
  )
  assert.match(publicControls, /편집 설정/)
  assert.doesNotMatch(publicControls, /로그아웃/)

  const editorControls = renderToStaticMarkup(
    React.createElement(EditorSessionControls, {
      authenticated: true,
      canChangePassword: true,
      editorName: "김지은",
      loading: false,
      setupRequired: false,
      onLogout() {},
      onOpen() {},
    }),
  )
  assert.match(editorControls, /편집 중: 김지은/)
  assert.match(editorControls, /비밀번호 변경/)
  assert.match(editorControls, /로그아웃/)
} finally {
  await rm(temp, { recursive: true, force: true })
}

console.log("editorial UI check passed")
