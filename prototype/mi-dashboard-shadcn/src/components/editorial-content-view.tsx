import type {
  BulletContent,
  EditorialContent,
  EditorialKind,
  RegionalContent,
  TitledContent,
} from "../lib/editorial-model.ts"

export function EditorialBadges({
  mode,
  published,
  reviewed,
}: {
  mode: "default" | "custom"
  published: boolean
  reviewed: boolean
}) {
  const badges = [
    mode === "default" ? "자동 생성" : "사용자 수정",
    reviewed ? "검토 완료" : "미검토",
    published ? "공개" : "비공개",
  ]
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="편집 상태">
      {badges.map((badge) => (
        <span className="type-control bg-secondary px-2 py-1" key={badge}>
          {badge}
        </span>
      ))}
    </div>
  )
}

export function EditorialContentView({
  content,
  kind,
}: {
  content: EditorialContent
  kind: EditorialKind
}) {
  if (kind === "titled") {
    return (
      <ul className="type-executive-body grid gap-2 text-muted-foreground">
        {(content as TitledContent).map(({ details, title }) => (
          <li className="flex gap-3" key={title}>
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-primary" />
            <div className="min-w-0">
              <p className="type-table-header text-foreground">{title}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  if (kind === "regional") {
    return (
      <div className="grid gap-3">
        {Object.entries(content as RegionalContent).map(([region, details]) => (
          <section key={region}>
            <h3 className="type-table-header">{region}</h3>
            <ul className="type-table-body mt-1 list-disc pl-4 text-muted-foreground">
              {details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    )
  }

  return (
    <ul className="type-executive-body grid gap-2 text-muted-foreground">
      {(content as BulletContent).map((observation) => (
        <li className="flex gap-3" key={observation}>
          <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-primary" />
          <span>{observation}</span>
        </li>
      ))}
    </ul>
  )
}

type DiffLine = { kind: "same" | "removed" | "added"; value: string }

function lineDiff(before: readonly string[], after: readonly string[]): DiffLine[] {
  const lengths = Array.from({ length: before.length + 1 }, () =>
    Array<number>(after.length + 1).fill(0),
  )
  for (let left = before.length - 1; left >= 0; left -= 1) {
    for (let right = after.length - 1; right >= 0; right -= 1) {
      lengths[left][right] =
        before[left] === after[right]
          ? lengths[left + 1][right + 1] + 1
          : Math.max(lengths[left + 1][right], lengths[left][right + 1])
    }
  }
  const result: DiffLine[] = []
  let left = 0
  let right = 0
  while (left < before.length || right < after.length) {
    if (left < before.length && right < after.length && before[left] === after[right]) {
      result.push({ kind: "same", value: before[left] })
      left += 1
      right += 1
    } else if (
      right < after.length &&
      (left === before.length || lengths[left][right + 1] >= lengths[left + 1][right])
    ) {
      result.push({ kind: "added", value: after[right] })
      right += 1
    } else {
      result.push({ kind: "removed", value: before[left] })
      left += 1
    }
  }
  return result
}

export function EditorialLineDiff({
  after,
  before,
}: {
  after: readonly string[]
  before: readonly string[]
}) {
  const lines = lineDiff(before, after)
  return (
    <div className="type-table-body overflow-hidden border" aria-label="문장 변경 비교">
      {lines.length ? (
        lines.map((line, index) => (
          <p
            className={`border-b px-3 py-1.5 last:border-b-0 ${
              line.kind === "added"
                ? "bg-blue-50 text-blue-900"
                : line.kind === "removed"
                  ? "bg-red-50 text-red-900 line-through"
                  : "text-muted-foreground"
            }`}
            key={`${line.kind}-${index}-${line.value}`}
          >
            <span aria-hidden="true" className="mr-2 inline-block w-3">
              {line.kind === "added" ? "+" : line.kind === "removed" ? "−" : " "}
            </span>
            {line.value}
          </p>
        ))
      ) : (
        <p className="px-3 py-2 text-muted-foreground">변경 없음</p>
      )}
    </div>
  )
}
