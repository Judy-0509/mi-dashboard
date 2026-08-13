export const editorialRegions = [
  "Total",
  "USA",
  "China",
  "Japan",
  "Europe",
  "India",
] as const

export type EditorialRegion = (typeof editorialRegions)[number]
export type EditorialKind = "bullets" | "titled" | "regional"
export type BulletContent = string[]
export type TitledSection = { title: string; details: string[] }
export type TitledContent = TitledSection[]
export type RegionalContent = Record<EditorialRegion, string[]>
export type EditorialContent = BulletContent | TitledContent | RegionalContent

export type PublishedEditorial = {
  sourceVersion: number
  content: EditorialContent
  publishedAt: string
  publishedBy: string
}

export type EditorialDraft = {
  mode: "default" | "custom"
  customContent: EditorialContent | null
  reviewed: boolean
  updatedAt: string
  updatedBy: string
}

export type EditorPage = {
  page: string
  kind: EditorialKind
  dataRevision: string
  version: number
  draft: EditorialDraft
  draftContent: EditorialContent
  defaultContent: EditorialContent
  published: PublishedEditorial | null
  readOnly: boolean
  warnings: string[]
}

export type PublicEditorialPage = {
  page: string
  published: PublishedEditorial | null
}

export type EditorialHistoryItem = {
  eventId: string
  page: string
  version: number
  parentVersion: number | null
  action: string
  editor: { name: string }
  timestamp: string
  restoredFromVersion: number | null
}

export type EditorialHistoryEvent = EditorialHistoryItem & {
  before: (Omit<EditorPage, "page" | "defaultContent" | "readOnly" | "warnings"> & {
    draftContent: EditorialContent
  }) | null
  after: Omit<EditorPage, "page" | "defaultContent" | "readOnly" | "warnings"> & {
    draftContent: EditorialContent
  }
}

function normalizeSentence(value: unknown, label: string, maximum: number) {
  if (typeof value !== "string") {
    throw new Error(`${label}은 문자열이어야 합니다.`)
  }
  const normalized = value.trim()
  if (normalized.length < 1 || normalized.length > maximum) {
    throw new Error(`${label}은 1~${maximum}자여야 합니다.`)
  }
  return normalized
}

export function normalizeEditorialContent(
  kind: EditorialKind,
  content: EditorialContent,
): EditorialContent {
  if (kind === "bullets") {
    if (!Array.isArray(content) || content.length < 1 || content.length > 3) {
      throw new Error("불릿은 1~3개여야 합니다.")
    }
    return content.map((item) => normalizeSentence(item, "불릿", 500))
  }

  if (kind === "titled") {
    if (!Array.isArray(content) || content.length < 1 || content.length > 3) {
      throw new Error("소제목은 1~3개여야 합니다.")
    }
    return content.map((section) => {
      if (
        typeof section !== "object" ||
        section === null ||
        !("title" in section) ||
        !("details" in section) ||
        !Array.isArray(section.details) ||
        section.details.length < 1 ||
        section.details.length > 5
      ) {
        throw new Error("소제목별 세부 문장은 1~5개여야 합니다.")
      }
      return {
        title: normalizeSentence(section.title, "소제목", 100),
        details: section.details.map((detail) =>
          normalizeSentence(detail, "세부 문장", 500),
        ),
      }
    })
  }

  if (Array.isArray(content) || typeof content !== "object" || content === null) {
    throw new Error("지역별 세부 내용 형식을 확인해 주세요.")
  }
  const keys = Object.keys(content)
  if (
    keys.length !== editorialRegions.length ||
    editorialRegions.some((region) => !keys.includes(region))
  ) {
    throw new Error("고정 지역 키를 확인해 주세요.")
  }
  return Object.fromEntries(
    editorialRegions.map((region) => {
      const details = content[region]
      if (!Array.isArray(details) || details.length > 3) {
        throw new Error("지역별 세부 문장은 0~3개여야 합니다.")
      }
      return [
        region,
        details.map((detail) =>
          normalizeSentence(detail, `${region} 세부 문장`, 500),
        ),
      ]
    }),
  ) as RegionalContent
}

export function flattenEditorialContent(
  kind: EditorialKind,
  content: EditorialContent,
): string[] {
  if (kind === "bullets") return [...(content as BulletContent)]
  if (kind === "titled") {
    return (content as TitledContent).flatMap(({ title, details }) => [
      title,
      ...details,
    ])
  }
  return editorialRegions.flatMap((region) =>
    (content as RegionalContent)[region].map((detail) => `${region}: ${detail}`),
  )
}

export function moveItem<T>(items: readonly T[], index: number, offset: -1 | 1): T[] {
  const nextIndex = index + offset
  if (index < 0 || index >= items.length || nextIndex < 0 || nextIndex >= items.length) {
    return [...items]
  }
  const next = [...items]
  const [item] = next.splice(index, 1)
  next.splice(nextIndex, 0, item)
  return next
}

export class EditorialApiError extends Error {
  status: number
  code: string
  latest: unknown

  constructor(message: string, status: number, code: string, latest?: unknown) {
    super(message)
    this.name = "EditorialApiError"
    this.status = status
    this.code = code
    this.latest = latest
  }
}

export type EditorialRequestOptions = {
  method?: "GET" | "POST" | "PUT"
  body?: object
  csrfToken?: string | null
}

export async function requestEditorial<T = unknown>(
  path: string,
  options: EditorialRequestOptions = {},
): Promise<T> {
  const headers = new Headers()
  if (options.body !== undefined) headers.set("Content-Type", "application/json")
  if (options.csrfToken) headers.set("X-CSRF-Token", options.csrfToken)
  const response = await fetch(path, {
    method: options.method ?? "GET",
    credentials: "same-origin",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; code?: string; latest?: unknown }
    | null
  if (!response.ok) {
    throw new EditorialApiError(
      payload?.error ?? `HTTP ${response.status}`,
      response.status,
      payload?.code ?? "request_failed",
      payload?.latest,
    )
  }
  return payload as T
}
