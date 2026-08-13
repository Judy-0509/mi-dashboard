import type * as React from "react"
import { useState } from "react"

export type EditorAccessMode = "setup" | "login" | "password"

export const editorAccessCopy = {
  setup: {
    title: "최초 편집 비밀번호 설정",
    description:
      "서버 PC의 localhost에서만 설정할 수 있습니다. 설정 후 편집자 이름으로 로그인하세요.",
    submit: "비밀번호 설정",
  },
  login: {
    title: "편집 모드 로그인",
    description: "작업 이력에 남길 이름과 공용 편집 비밀번호를 입력하세요.",
    submit: "편집 모드 시작",
  },
  password: {
    title: "공용 비밀번호 변경",
    description:
      "변경 즉시 모든 편집 세션이 로그아웃됩니다. 서버 PC의 localhost에서만 가능합니다.",
    submit: "비밀번호 변경",
  },
} as const

const buttonClass =
  "type-control inline-flex h-8 items-center justify-center border px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"

export function EditorAccessPanel({
  busy,
  error,
  mode,
  onCancel,
  onSubmit,
}: {
  busy: boolean
  error: string | null
  mode: EditorAccessMode
  onCancel: () => void
  onSubmit: (values: { name: string; password: string }) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const copy = editorAccessCopy[mode]

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit({ name, password })
    setPassword("")
  }

  return (
    <form
      className="w-[420px] max-w-[calc(100vw-32px)] bg-background p-5"
      onSubmit={submit}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="type-card-title">{copy.title}</h2>
          <p className="type-page-subtitle mt-1 text-muted-foreground">
            {copy.description}
          </p>
        </div>
        <button
          aria-label="닫기"
          className="type-card-title inline-flex size-7 items-center justify-center outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          disabled={busy}
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {mode === "login" ? (
          <label className="grid gap-1.5">
            <span className="type-control-label">편집자 이름</span>
            <input
              autoComplete="name"
              autoFocus
              className="type-page-subtitle h-9 border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              maxLength={40}
              name="name"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>
        ) : null}
        <label className="grid gap-1.5">
          <span className="type-control-label">공용 비밀번호</span>
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            autoFocus={mode !== "login"}
            className="type-page-subtitle h-9 border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            maxLength={128}
            minLength={10}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
      </div>

      {error ? (
        <p className="type-control mt-3 text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end gap-2">
        <button
          className={`${buttonClass} bg-background`}
          disabled={busy}
          onClick={onCancel}
          type="button"
        >
          취소
        </button>
        <button
          className={`${buttonClass} border-primary bg-primary text-primary-foreground`}
          disabled={busy}
          type="submit"
        >
          {busy ? "처리 중" : copy.submit}
        </button>
      </div>
    </form>
  )
}

export function EditorSessionControls({
  authenticated,
  canChangePassword,
  editorName,
  loading,
  onLogout,
  onOpen,
  setupRequired,
}: {
  authenticated: boolean
  canChangePassword: boolean
  editorName: string | null
  loading: boolean
  onLogout: () => void
  onOpen: () => void
  setupRequired: boolean
}) {
  if (loading) {
    return <span className="type-control text-muted-foreground">편집 확인 중</span>
  }
  if (!authenticated) {
    return (
      <button className={`${buttonClass} bg-background`} onClick={onOpen} type="button">
        {setupRequired ? "편집 설정" : "편집 모드"}
      </button>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <span className="type-control-label bg-secondary px-2 py-1">
        편집 중: {editorName}
      </span>
      {canChangePassword ? (
        <button className={`${buttonClass} bg-background`} onClick={onOpen} type="button">
          비밀번호 변경
        </button>
      ) : null}
      <button className={`${buttonClass} bg-background`} onClick={onLogout} type="button">
        로그아웃
      </button>
    </div>
  )
}
