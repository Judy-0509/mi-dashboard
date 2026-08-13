import { useEffect, useState } from "react"

import {
  EditorialBadges,
  EditorialContentView,
  EditorialLineDiff,
} from "@/components/editorial-content-view"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PortalPage } from "@/components/portal-sidebar"
import {
  isEditorPage,
  useEditorialPage,
  useEditorialSession,
  type EditorialPageController,
} from "@/lib/editorial"
import {
  flattenEditorialContent,
  moveItem,
  normalizeEditorialContent,
  type BulletContent,
  type EditorialContent,
  type EditorialHistoryEvent,
  type EditorialHistoryItem,
  type EditorialKind,
  type EditorialRegion,
  type EditorPage,
  type RegionalContent,
  type TitledContent,
} from "@/lib/editorial-model"

const actionClass =
  "type-control inline-flex h-7 items-center justify-center border bg-background px-2.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
const primaryActionClass = `${actionClass} border-primary bg-primary text-primary-foreground hover:bg-primary/80`
const inputClass =
  "type-page-subtitle w-full border bg-background px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"

function cloneContent<T extends EditorialContent>(content: T): T {
  return structuredClone(content)
}

export type RegionalMetricRow = {
  region: EditorialRegion
  yoy: number | null
  wow: number | null
}

function formatMetric(value: number | null) {
  if (value === null) return "N/A"
  return `${value < 0 ? "△" : value > 0 ? "+" : ""}${Math.abs(value).toFixed(1)}%`
}

function RegionalTable({
  content,
  onChange,
  rows,
}: {
  content: RegionalContent | null
  onChange?: (content: RegionalContent) => void
  rows: readonly RegionalMetricRow[]
}) {
  const editing = onChange !== undefined
  const showDetails = editing || content !== null
  const updateDetails = (region: EditorialRegion, details: string[]) => {
    if (!content || !onChange) return
    onChange({ ...content, [region]: details })
  }

  return (
    <div className="w-full overflow-hidden border">
      <table
        aria-label="지역별 YoY·WoW"
        className="type-table-body w-full table-fixed border-collapse"
      >
        <caption className="sr-only">
          {showDetails ? "지역별 YoY·WoW와 공개된 세부 내용" : "지역별 YoY·WoW"}
        </caption>
        <colgroup>
          <col className={showDetails ? "w-[15%]" : "w-[34%]"} />
          <col className={showDetails ? "w-[12%]" : "w-[33%]"} />
          <col className={showDetails ? "w-[12%]" : "w-[33%]"} />
          {showDetails ? <col className="w-[61%]" /> : null}
        </colgroup>
        <thead className="type-table-header bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left" scope="col">지역</th>
            <th className="px-3 py-2 text-right" scope="col">YoY (%)</th>
            <th className="px-3 py-2 text-right" scope="col">WoW (%)</th>
            {showDetails ? <th className="px-3 py-2 text-left" scope="col">세부 내용</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(({ region, wow, yoy }) => {
            const details = content?.[region] ?? []
            return (
              <tr key={region}>
                <th className="type-table-header px-3 py-2 text-left align-top text-foreground" scope="row">
                  {region}
                </th>
                {[yoy, wow].map((value, index) => (
                  <td
                    className={`type-table-body px-3 py-2 text-right align-top tabular-nums whitespace-nowrap ${
                      value !== null && value < 0 ? "text-destructive" : "text-foreground"
                    }`}
                    key={index}
                  >
                    {formatMetric(value)}
                  </td>
                ))}
                {showDetails ? (
                  <td className="type-table-body min-w-0 px-3 py-2 align-top text-muted-foreground">
                    {editing ? (
                      <div className="grid gap-2">
                        {details.map((detail, detailIndex) => (
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2" key={detailIndex}>
                            <textarea
                              aria-label={`${region} 세부 문장 ${detailIndex + 1}`}
                              className={`${inputClass} min-h-14 resize-y`}
                              maxLength={500}
                              onChange={(event) => {
                                const next = [...details]
                                next[detailIndex] = event.target.value
                                updateDetails(region, next)
                              }}
                              value={detail}
                            />
                            <div className="flex gap-1">
                              <button
                                aria-label={`${region} 세부 문장 ${detailIndex + 1} 위로`}
                                className={actionClass}
                                disabled={detailIndex === 0}
                                onClick={() => updateDetails(region, moveItem(details, detailIndex, -1))}
                                type="button"
                              >
                                ↑
                              </button>
                              <button
                                aria-label={`${region} 세부 문장 ${detailIndex + 1} 아래로`}
                                className={actionClass}
                                disabled={detailIndex === details.length - 1}
                                onClick={() => updateDetails(region, moveItem(details, detailIndex, 1))}
                                type="button"
                              >
                                ↓
                              </button>
                              <button
                                aria-label={`${region} 세부 문장 ${detailIndex + 1} 삭제`}
                                className={actionClass}
                                onClick={() => updateDetails(region, details.filter((_, itemIndex) => itemIndex !== detailIndex))}
                                type="button"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          className={`${actionClass} justify-self-start`}
                          disabled={details.length >= 3}
                          onClick={() => updateDetails(region, [...details, ""])}
                          type="button"
                        >
                          문장 추가
                        </button>
                      </div>
                    ) : (
                      <ul className="grid list-disc gap-0.5 pl-4">
                        {details.map((detail) => <li className="break-words" key={detail}>{detail}</li>)}
                      </ul>
                    )}
                  </td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function BulletsEditor({
  content,
  onChange,
}: {
  content: BulletContent
  onChange: (content: BulletContent) => void
}) {
  return (
    <div className="grid gap-2">
      {content.map((value, index) => (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2" key={index}>
          <textarea
            aria-label={`불릿 ${index + 1}`}
            className={`${inputClass} min-h-16 resize-y`}
            maxLength={500}
            onChange={(event) => {
              const next = [...content]
              next[index] = event.target.value
              onChange(next)
            }}
            value={value}
          />
          <div className="flex flex-col gap-1">
            <button
              aria-label={`불릿 ${index + 1} 위로`}
              className={actionClass}
              disabled={index === 0}
              onClick={() => onChange(moveItem(content, index, -1))}
              type="button"
            >
              ↑
            </button>
            <button
              aria-label={`불릿 ${index + 1} 아래로`}
              className={actionClass}
              disabled={index === content.length - 1}
              onClick={() => onChange(moveItem(content, index, 1))}
              type="button"
            >
              ↓
            </button>
            <button
              aria-label={`불릿 ${index + 1} 삭제`}
              className={actionClass}
              disabled={content.length === 1}
              onClick={() => onChange(content.filter((_, itemIndex) => itemIndex !== index))}
              type="button"
            >
              삭제
            </button>
          </div>
        </div>
      ))}
      <button
        className={`${actionClass} justify-self-start`}
        disabled={content.length >= 3}
        onClick={() => onChange([...content, ""])}
        type="button"
      >
        불릿 추가
      </button>
    </div>
  )
}

function TitledEditor({
  content,
  onChange,
}: {
  content: TitledContent
  onChange: (content: TitledContent) => void
}) {
  const updateSection = (index: number, section: TitledContent[number]) => {
    const next = [...content]
    next[index] = section
    onChange(next)
  }

  return (
    <div className="grid gap-3">
      {content.map((section, sectionIndex) => (
        <section className="border p-3" key={sectionIndex}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input
              aria-label={`소제목 ${sectionIndex + 1}`}
              className={inputClass}
              maxLength={100}
              onChange={(event) =>
                updateSection(sectionIndex, { ...section, title: event.target.value })
              }
              value={section.title}
            />
            <div className="flex gap-1">
              <button
                aria-label={`소제목 ${sectionIndex + 1} 위로`}
                className={actionClass}
                disabled={sectionIndex === 0}
                onClick={() => onChange(moveItem(content, sectionIndex, -1))}
                type="button"
              >
                ↑
              </button>
              <button
                aria-label={`소제목 ${sectionIndex + 1} 아래로`}
                className={actionClass}
                disabled={sectionIndex === content.length - 1}
                onClick={() => onChange(moveItem(content, sectionIndex, 1))}
                type="button"
              >
                ↓
              </button>
              <button
                className={actionClass}
                disabled={content.length === 1}
                onClick={() =>
                  onChange(content.filter((_, index) => index !== sectionIndex))
                }
                type="button"
              >
                삭제
              </button>
            </div>
          </div>
          <div className="mt-2 grid gap-2 pl-4">
            {section.details.map((detail, detailIndex) => (
              <div
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
                key={detailIndex}
              >
                <textarea
                  aria-label={`${section.title || `소제목 ${sectionIndex + 1}`} 세부 문장 ${detailIndex + 1}`}
                  className={`${inputClass} min-h-14 resize-y`}
                  maxLength={500}
                  onChange={(event) => {
                    const details = [...section.details]
                    details[detailIndex] = event.target.value
                    updateSection(sectionIndex, { ...section, details })
                  }}
                  value={detail}
                />
                <div className="flex gap-1">
                  <button
                    aria-label={`세부 문장 ${detailIndex + 1} 위로`}
                    className={actionClass}
                    disabled={detailIndex === 0}
                    onClick={() =>
                      updateSection(sectionIndex, {
                        ...section,
                        details: moveItem(section.details, detailIndex, -1),
                      })
                    }
                    type="button"
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`세부 문장 ${detailIndex + 1} 아래로`}
                    className={actionClass}
                    disabled={detailIndex === section.details.length - 1}
                    onClick={() =>
                      updateSection(sectionIndex, {
                        ...section,
                        details: moveItem(section.details, detailIndex, 1),
                      })
                    }
                    type="button"
                  >
                    ↓
                  </button>
                  <button
                    className={actionClass}
                    disabled={section.details.length === 1}
                    onClick={() =>
                      updateSection(sectionIndex, {
                        ...section,
                        details: section.details.filter(
                          (_, index) => index !== detailIndex,
                        ),
                      })
                    }
                    type="button"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
            <button
              className={`${actionClass} justify-self-start`}
              disabled={section.details.length >= 5}
              onClick={() =>
                updateSection(sectionIndex, {
                  ...section,
                  details: [...section.details, ""],
                })
              }
              type="button"
            >
              세부 문장 추가
            </button>
          </div>
        </section>
      ))}
      <button
        className={`${actionClass} justify-self-start`}
        disabled={content.length >= 3}
        onClick={() => onChange([...content, { title: "", details: [""] }])}
        type="button"
      >
        소제목 추가
      </button>
    </div>
  )
}

function HistoryPanel({
  controller,
  kind,
  pageState,
}: {
  controller: EditorialPageController
  kind: EditorialKind
  pageState: EditorPage
}) {
  const [versions, setVersions] = useState<EditorialHistoryItem[]>([])
  const [primary, setPrimary] = useState<EditorialHistoryEvent | null>(null)
  const [comparison, setComparison] = useState<EditorialHistoryEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await controller.loadHistory()
      setVersions(items)
      if (items[0]) setPrimary(await controller.loadHistoryVersion(items[0].version))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "이력을 불러올 수 없습니다.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    void controller
      .loadHistory()
      .then(async (items) => ({
        items,
        first: items[0]
          ? await controller.loadHistoryVersion(items[0].version)
          : null,
      }))
      .then(({ first, items }) => {
        if (!active) return
        setVersions(items)
        setPrimary(first)
        setError(null)
      })
      .catch((caught: unknown) => {
        if (!active) return
        setError(caught instanceof Error ? caught.message : "이력을 불러올 수 없습니다.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // 패널을 여는 시점의 controller로 한 번만 불러온다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectPrimary = async (version: number) => {
    setLoading(true)
    try {
      setPrimary(await controller.loadHistoryVersion(version))
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "버전을 불러올 수 없습니다.")
    } finally {
      setLoading(false)
    }
  }

  const selectComparison = async (value: string) => {
    if (!value) {
      setComparison(null)
      return
    }
    setLoading(true)
    try {
      setComparison(await controller.loadHistoryVersion(Number(value)))
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "비교 버전을 불러올 수 없습니다.")
    } finally {
      setLoading(false)
    }
  }

  const restore = async () => {
    if (!primary || !window.confirm(`버전 ${primary.version}을 새 작업본으로 복원할까요?`)) {
      return
    }
    setLoading(true)
    try {
      await controller.restore(pageState.version, primary.version)
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "버전을 복원할 수 없습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 grid grid-cols-[220px_minmax(0,1fr)] gap-4 border-t pt-4">
      <div className="max-h-80 overflow-y-auto border">
        {versions.map((item) => (
          <button
            className={`type-table-body block w-full border-b px-3 py-2 text-left last:border-b-0 ${
              primary?.version === item.version ? "bg-secondary" : "hover:bg-muted"
            }`}
            key={item.eventId}
            onClick={() => void selectPrimary(item.version)}
            type="button"
          >
            <span className="type-table-header block">v{item.version} · {item.action}</span>
            <span className="block text-muted-foreground">{item.editor.name}</span>
            <time className="block tabular-nums text-muted-foreground">
              {new Date(item.timestamp).toLocaleString("ko-KR")}
            </time>
          </button>
        ))}
      </div>
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="type-section-title">
              {primary ? `버전 ${primary.version} · ${primary.action}` : "버전을 선택하세요"}
            </p>
            {primary ? (
              <p className="type-control text-muted-foreground">
                {primary.editor.name} · {new Date(primary.timestamp).toLocaleString("ko-KR")}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <label className="type-control-label" htmlFor={`history-compare-${pageState.page}`}>
              비교 버전
            </label>
            <select
              className="type-control h-7 border bg-background px-2"
              id={`history-compare-${pageState.page}`}
              onChange={(event) => void selectComparison(event.target.value)}
              value={comparison?.version ?? ""}
            >
              <option value="">직전 버전</option>
              {versions.map((item) => (
                <option key={item.version} value={item.version}>
                  v{item.version}
                </option>
              ))}
            </select>
            <button
              className={actionClass}
              disabled={!primary || loading || pageState.readOnly}
              onClick={() => void restore()}
              type="button"
            >
              이 버전 복원
            </button>
          </div>
        </div>
        {error ? <p className="type-control mb-2 text-destructive">{error}</p> : null}
        {primary ? (
          <>
            <EditorialLineDiff
              after={flattenEditorialContent(kind, primary.after.draftContent)}
              before={
                comparison
                  ? flattenEditorialContent(kind, comparison.after.draftContent)
                  : primary.before
                    ? flattenEditorialContent(kind, primary.before.draftContent)
                    : []
              }
            />
            <div className="mt-3 border p-3">
              <p className="type-control-label mb-2">선택 버전 전체 내용</p>
              <EditorialContentView content={primary.after.draftContent} kind={kind} />
            </div>
          </>
        ) : loading ? (
          <p className="type-control text-muted-foreground">이력 불러오는 중</p>
        ) : null}
      </div>
    </div>
  )
}

export function EditorialSummary({
  kind = "bullets",
  page,
  regionalRows = [],
  title = "Executive Summary",
}: {
  kind?: EditorialKind
  page: PortalPage
  regionalRows?: readonly RegionalMetricRow[]
  title?: string
}) {
  const controller = useEditorialPage(page)
  const { session, setPageDirty } = useEditorialSession()
  const [working, setWorking] = useState<EditorialContent | null>(null)
  const [workingMode, setWorkingMode] = useState<"default" | "custom">("custom")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pageState = isEditorPage(controller.data) ? controller.data : null
  const published = controller.data?.published ?? null

  useEffect(
    () => () => {
      setPageDirty(page, false)
    },
    [page, setPageDirty],
  )

  if (controller.loading) return null
  if (!session.authenticated) {
    if (!published && kind !== "regional") return null
    return (
      <Card className="my-4 border-border shadow-none" size="sm">
        <CardHeader className="pb-2">
          <CardTitle className="type-executive-title">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {kind === "regional" ? (
            <RegionalTable
              content={(published?.content as RegionalContent | undefined) ?? null}
              rows={regionalRows}
            />
          ) : published ? (
            <EditorialContentView content={published.content} kind={kind} />
          ) : null}
        </CardContent>
      </Card>
    )
  }
  if (!pageState) {
    return controller.error ? (
      <p className="type-control my-4 border p-3 text-destructive">{controller.error}</p>
    ) : null
  }

  const markDirty = (content: EditorialContent) => {
    setWorking(content)
    setWorkingMode("custom")
    setPageDirty(page, true)
  }

  const startEditing = () => {
    setWorking(cloneContent(pageState.draftContent))
    setWorkingMode(pageState.draft.mode)
    setError(null)
  }

  const cancelEditing = () => {
    setWorking(null)
    setPageDirty(page, false)
    controller.clearConflict()
    setError(null)
  }

  const save = async (expectedVersion = pageState.version) => {
    if (!working) return
    setBusy(true)
    setError(null)
    try {
      const normalized = normalizeEditorialContent(kind, working)
      await controller.saveDraft(expectedVersion, workingMode, normalized)
      setWorking(null)
      setPageDirty(page, false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "작업본을 저장할 수 없습니다.")
    } finally {
      setBusy(false)
    }
  }

  const run = async (operation: () => Promise<EditorPage>) => {
    setBusy(true)
    setError(null)
    try {
      await operation()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "요청을 처리할 수 없습니다.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="my-4 border-border shadow-none" size="sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="type-executive-title">{title}</CardTitle>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <EditorialBadges
            mode={pageState.draft.mode}
            published={pageState.published !== null}
            reviewed={pageState.draft.reviewed}
          />
          {working ? null : (
            <>
              <button
                className={actionClass}
                disabled={busy || pageState.readOnly}
                onClick={startEditing}
                type="button"
              >
                편집
              </button>
              <button
                className={actionClass}
                onClick={() => setHistoryOpen((open) => !open)}
                type="button"
              >
                변경 이력
              </button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {pageState.warnings.map((warning) => (
          <p className="type-control mb-2 border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900" key={warning}>
            {warning}
          </p>
        ))}
        {working ? (
          <>
            {kind === "titled" ? (
              <TitledEditor content={working as TitledContent} onChange={markDirty} />
            ) : kind === "regional" ? (
              <RegionalTable
                content={working as RegionalContent}
                onChange={markDirty}
                rows={regionalRows}
              />
            ) : (
              <BulletsEditor content={working as BulletContent} onChange={markDirty} />
            )}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
              <button
                className={actionClass}
                disabled={busy}
                onClick={() => {
                  if (!window.confirm("현재 입력을 버리고 자동 생성본으로 복원할까요?")) return
                  setWorking(cloneContent(pageState.defaultContent))
                  setWorkingMode("default")
                  setPageDirty(page, true)
                }}
                type="button"
              >
                자동 생성본으로 복원
              </button>
              <div className="flex gap-2">
                <button className={actionClass} disabled={busy} onClick={cancelEditing} type="button">
                  취소
                </button>
                <button className={primaryActionClass} disabled={busy} onClick={() => void save()} type="button">
                  작업본 저장
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {kind === "regional" ? (
              <RegionalTable
                content={pageState.draftContent as RegionalContent}
                rows={regionalRows}
              />
            ) : (
              <EditorialContentView content={pageState.draftContent} kind={kind} />
            )}
            <div className="mt-3 flex flex-wrap justify-end gap-2 border-t pt-3">
              <button
                className={actionClass}
                disabled={busy || pageState.readOnly}
                onClick={() =>
                  void run(() =>
                    controller.setReviewed(pageState.version, !pageState.draft.reviewed),
                  )
                }
                type="button"
              >
                {pageState.draft.reviewed ? "검토 해제" : "검토 완료"}
              </button>
              {pageState.published ? (
                <button
                  className={actionClass}
                  disabled={busy || pageState.readOnly}
                  onClick={() =>
                    void run(() => controller.unpublish(pageState.version))
                  }
                  type="button"
                >
                  공개 취소
                </button>
              ) : (
                <button
                  className={primaryActionClass}
                  disabled={busy || pageState.readOnly || !pageState.draft.reviewed}
                  onClick={() => void run(() => controller.publish(pageState.version))}
                  type="button"
                >
                  공개
                </button>
              )}
            </div>
          </>
        )}

        {error ? <p className="type-control mt-3 text-destructive">{error}</p> : null}

        {working && controller.conflict ? (
          <div className="mt-4 border border-amber-300 bg-amber-50 p-3">
            <p className="type-section-title text-amber-950">다른 편집자의 최신본이 있습니다.</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="border bg-background p-3">
                <p className="type-control-label mb-2">내 초안</p>
                <EditorialContentView content={working} kind={kind} />
              </div>
              <div className="border bg-background p-3">
                <p className="type-control-label mb-2">
                  최신본 · {controller.conflict.draft.updatedBy}
                </p>
                <EditorialContentView content={controller.conflict.draftContent} kind={kind} />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                className={actionClass}
                onClick={() => {
                  void controller.reload().then(cancelEditing)
                }}
                type="button"
              >
                최신본 불러오기
              </button>
              <button
                className={primaryActionClass}
                onClick={() => void save(controller.conflict?.version)}
                type="button"
              >
                최신 버전에 내 초안 저장
              </button>
            </div>
          </div>
        ) : null}

        {historyOpen && !working ? (
          <HistoryPanel controller={controller} kind={kind} pageState={pageState} />
        ) : null}
      </CardContent>
    </Card>
  )
}
