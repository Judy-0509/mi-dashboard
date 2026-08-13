import { useEffect, useRef, useState } from "react"

import {
  EditorAccessPanel,
  editorAccessCopy,
  type EditorAccessMode,
} from "@/components/editor-access-panel"
import { useEditorialSession } from "@/lib/editorial"

export function EditorAccess() {
  const {
    accessOpen,
    changePassword,
    login,
    session,
    setAccessOpen,
    setup,
  } = useEditorialSession()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mode: EditorAccessMode = session.authenticated
    ? "password"
    : session.setupRequired
      ? "setup"
      : "login"

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (accessOpen && !dialog.open) dialog.showModal()
    if (!accessOpen && dialog.open) dialog.close()
  }, [accessOpen])

  const close = () => {
    if (busy) return
    setError(null)
    setAccessOpen(false)
  }

  const submit = async ({ name, password }: { name: string; password: string }) => {
    setBusy(true)
    setError(null)
    try {
      if (mode === "setup") await setup(password)
      else if (mode === "password") await changePassword(password)
      else await login(name, password)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "요청을 처리할 수 없습니다.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      aria-labelledby="editor-access-title"
      className="m-auto border p-0 shadow-xl backdrop:bg-black/30"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onClose={() => setAccessOpen(false)}
      ref={dialogRef}
    >
      <div id="editor-access-title" className="sr-only">
        {editorAccessCopy[mode].title}
      </div>
      <EditorAccessPanel
        busy={busy}
        error={error}
        mode={mode}
        onCancel={close}
        onSubmit={submit}
      />
    </dialog>
  )
}
