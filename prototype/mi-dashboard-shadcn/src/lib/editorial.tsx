import type * as React from "react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import type { PortalPage } from "@/components/portal-sidebar"
import {
  EditorialApiError,
  requestEditorial,
  type EditorialContent,
  type EditorialHistoryEvent,
  type EditorialHistoryItem,
  type EditorPage,
  type PublicEditorialPage,
} from "@/lib/editorial-model"

export type EditorialSession = {
  authenticated: boolean
  editorName: string | null
  csrfToken: string | null
  setupRequired: boolean
  setupAllowed: boolean
  canChangePassword: boolean
}

const emptySession: EditorialSession = {
  authenticated: false,
  editorName: null,
  csrfToken: null,
  setupRequired: false,
  setupAllowed: false,
  canChangePassword: false,
}

type EditorialContextValue = {
  disabled: boolean
  session: EditorialSession
  sessionLoading: boolean
  sessionError: string | null
  accessOpen: boolean
  setAccessOpen: (open: boolean) => void
  setup: (password: string) => Promise<void>
  login: (name: string, password: string) => Promise<void>
  logout: () => Promise<boolean>
  changePassword: (password: string) => Promise<void>
  refreshSession: () => Promise<void>
  hasUnsavedChanges: boolean
  setPageDirty: (page: PortalPage, dirty: boolean) => void
  confirmDiscard: () => boolean
}

const EditorialContext = createContext<EditorialContextValue | null>(null)

export function EditorialProvider({
  children,
  disabled = false,
}: {
  children: React.ReactNode
  disabled?: boolean
}) {
  const [session, setSession] = useState<EditorialSession>(emptySession)
  const [sessionLoading, setSessionLoading] = useState(!disabled)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [accessOpen, setAccessOpen] = useState(false)
  const [dirtyPages, setDirtyPages] = useState<Set<PortalPage>>(() => new Set())

  const refreshSession = useCallback(async () => {
    if (disabled) return
    try {
      setSession(
        await requestEditorial<EditorialSession>("/api/editor/session"),
      )
      setSessionError(null)
    } catch (error) {
      setSession(emptySession)
      setSessionError(
        error instanceof Error ? error.message : "편집 서버에 연결할 수 없습니다.",
      )
    } finally {
      setSessionLoading(false)
    }
  }, [disabled])

  useEffect(() => {
    if (disabled) return
    let active = true
    void requestEditorial<EditorialSession>("/api/editor/session")
      .then((next) => {
        if (!active) return
        setSession(next)
        setSessionError(null)
      })
      .catch((error: unknown) => {
        if (!active) return
        setSession(emptySession)
        setSessionError(
          error instanceof Error
            ? error.message
            : "편집 서버에 연결할 수 없습니다.",
        )
      })
      .finally(() => {
        if (active) setSessionLoading(false)
      })
    return () => {
      active = false
    }
  }, [disabled])

  const hasUnsavedChanges = dirtyPages.size > 0
  const confirmDiscard = useCallback(
    () =>
      !hasUnsavedChanges ||
      window.confirm("저장하지 않은 편집 내용이 있습니다. 이동할까요?"),
    [hasUnsavedChanges],
  )

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warnBeforeUnload)
    return () => window.removeEventListener("beforeunload", warnBeforeUnload)
  }, [hasUnsavedChanges])

  const setPageDirty = useCallback((page: PortalPage, dirty: boolean) => {
    setDirtyPages((current) => {
      const next = new Set(current)
      if (dirty) next.add(page)
      else next.delete(page)
      return next
    })
  }, [])

  const setup = useCallback(async (password: string) => {
    await requestEditorial("/api/editor/setup", {
      method: "POST",
      body: { password },
    })
    setSession((current) => ({ ...current, setupRequired: false }))
  }, [])

  const login = useCallback(async (name: string, password: string) => {
    const next = await requestEditorial<EditorialSession>("/api/editor/login", {
      method: "POST",
      body: { name, password },
    })
    setSession(next)
    setSessionError(null)
    setAccessOpen(false)
  }, [])

  const logout = useCallback(async () => {
    if (!confirmDiscard()) return false
    await requestEditorial("/api/editor/logout", {
      method: "POST",
      csrfToken: session.csrfToken,
    })
    setSession(emptySession)
    setDirtyPages(new Set())
    setAccessOpen(false)
    return true
  }, [confirmDiscard, session.csrfToken])

  const changePassword = useCallback(
    async (password: string) => {
      await requestEditorial("/api/editor/password", {
        method: "PUT",
        body: { password },
        csrfToken: session.csrfToken,
      })
      setSession(emptySession)
      setDirtyPages(new Set())
      setAccessOpen(false)
    },
    [session.csrfToken],
  )

  const value = useMemo<EditorialContextValue>(
    () => ({
      disabled,
      session,
      sessionLoading,
      sessionError,
      accessOpen,
      setAccessOpen,
      setup,
      login,
      logout,
      changePassword,
      refreshSession,
      hasUnsavedChanges,
      setPageDirty,
      confirmDiscard,
    }),
    [
      accessOpen,
      changePassword,
      confirmDiscard,
      disabled,
      hasUnsavedChanges,
      login,
      logout,
      refreshSession,
      session,
      sessionError,
      sessionLoading,
      setPageDirty,
      setup,
    ],
  )

  return (
    <EditorialContext.Provider value={value}>
      {children}
    </EditorialContext.Provider>
  )
}

export function useEditorialSession() {
  const context = useContext(EditorialContext)
  if (!context) {
    throw new Error("useEditorialSession must be used inside EditorialProvider")
  }
  return context
}

export type EditorialPageController = {
  data: EditorPage | PublicEditorialPage | null
  loading: boolean
  error: string | null
  conflict: EditorPage | null
  reload: () => Promise<void>
  clearConflict: () => void
  saveDraft: (
    expectedVersion: number,
    mode: "default" | "custom",
    content: EditorialContent,
  ) => Promise<EditorPage>
  setReviewed: (expectedVersion: number, reviewed: boolean) => Promise<EditorPage>
  publish: (expectedVersion: number) => Promise<EditorPage>
  unpublish: (expectedVersion: number) => Promise<EditorPage>
  loadHistory: () => Promise<EditorialHistoryItem[]>
  loadHistoryVersion: (version: number) => Promise<EditorialHistoryEvent>
  restore: (expectedVersion: number, version: number) => Promise<EditorPage>
}

export function useEditorialPage(page: PortalPage): EditorialPageController {
  const { disabled, session, sessionLoading, refreshSession } =
    useEditorialSession()
  const [data, setData] = useState<EditorPage | PublicEditorialPage | null>(null)
  const [loading, setLoading] = useState(!disabled)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState<EditorPage | null>(null)

  const reload = useCallback(async () => {
    if (disabled || sessionLoading) return
    try {
      const path = session.authenticated
        ? `/api/editor/pages/${page}`
        : `/api/editorial/pages/${page}`
      setData(await requestEditorial<EditorPage | PublicEditorialPage>(path))
      setError(null)
      setConflict(null)
    } catch (caught) {
      setData(null)
      setError(
        caught instanceof Error ? caught.message : "편집 내용을 불러올 수 없습니다.",
      )
      if (caught instanceof EditorialApiError && caught.status === 401) {
        await refreshSession()
      }
    } finally {
      setLoading(false)
    }
  }, [disabled, page, refreshSession, session.authenticated, sessionLoading])

  useEffect(() => {
    if (disabled || sessionLoading) return
    let active = true
    const path = session.authenticated
      ? `/api/editor/pages/${page}`
      : `/api/editorial/pages/${page}`
    void requestEditorial<EditorPage | PublicEditorialPage>(path)
      .then((next) => {
        if (!active) return
        setData(next)
        setError(null)
        setConflict(null)
      })
      .catch((caught: unknown) => {
        if (!active) return
        setData(null)
        setError(
          caught instanceof Error
            ? caught.message
            : "편집 내용을 불러올 수 없습니다.",
        )
        if (caught instanceof EditorialApiError && caught.status === 401) {
          void refreshSession()
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [disabled, page, refreshSession, session.authenticated, sessionLoading])

  const mutate = useCallback(
    async (path: string, method: "POST" | "PUT", body: object) => {
      try {
        const result = await requestEditorial<EditorPage>(path, {
          method,
          body,
          csrfToken: session.csrfToken,
        })
        setData(result)
        setError(null)
        setConflict(null)
        return result
      } catch (caught) {
        if (
          caught instanceof EditorialApiError &&
          caught.status === 409 &&
          caught.latest &&
          typeof caught.latest === "object"
        ) {
          setConflict(caught.latest as EditorPage)
        }
        if (caught instanceof EditorialApiError && caught.status === 401) {
          await refreshSession()
        }
        throw caught
      }
    },
    [refreshSession, session.csrfToken],
  )

  return {
    data,
    loading,
    error,
    conflict,
    reload,
    clearConflict: () => setConflict(null),
    saveDraft: (expectedVersion, mode, content) =>
      mutate(`/api/editor/pages/${page}/draft`, "PUT", {
        expectedVersion,
        mode,
        content,
      }),
    setReviewed: (expectedVersion, reviewed) =>
      mutate(`/api/editor/pages/${page}/review`, "POST", {
        expectedVersion,
        reviewed,
      }),
    publish: (expectedVersion) =>
      mutate(`/api/editor/pages/${page}/publish`, "POST", { expectedVersion }),
    unpublish: (expectedVersion) =>
      mutate(`/api/editor/pages/${page}/unpublish`, "POST", { expectedVersion }),
    loadHistory: async () => {
      const result = await requestEditorial<{
        page: string
        versions: EditorialHistoryItem[]
      }>(`/api/editor/pages/${page}/history`)
      return result.versions
    },
    loadHistoryVersion: (version) =>
      requestEditorial<EditorialHistoryEvent>(
        `/api/editor/pages/${page}/history/${version}`,
      ),
    restore: (expectedVersion, version) =>
      mutate(`/api/editor/pages/${page}/restore`, "POST", {
        expectedVersion,
        version,
      }),
  }
}

export function isEditorPage(
  data: EditorPage | PublicEditorialPage | null,
): data is EditorPage {
  return data !== null && "draft" in data
}
