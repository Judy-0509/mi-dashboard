import { Download, FileSpreadsheet, MessageSquareText } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import pageConfig from "@/data/page-config.json"
import type { PortalPage } from "@/components/portal-sidebar"
import { useHoverDetails } from "@/lib/hover-details"

declare global {
  interface Window {
    __MI_EXPORT_PAGE__?: PortalPage
  }
}

export type PageConfig = {
  hash: string
  exportFileName: string
  originalExcelUrl: string | null
}

export const PAGE_CONFIG = pageConfig as Record<PortalPage, PageConfig>
export const exportPage = window.__MI_EXPORT_PAGE__
export const isExport = exportPage !== undefined

export function pageFromHash(): PortalPage {
  if (exportPage) {
    return exportPage
  }

  return (
    (Object.entries(PAGE_CONFIG).find(([, config]) => config.hash === window.location.hash)?.[0] as
      | PortalPage
      | undefined) ?? "sigma"
  )
}

export function PageActions({ page }: { page: PortalPage }) {
  const { enabled: hoverDetailsEnabled, onEnabledChange } = useHoverDetails()

  if (isExport) {
    return null
  }

  const config = PAGE_CONFIG[page]
  const excelDisabled = config.originalExcelUrl === null

  return (
    <div className="flex items-center gap-2">
      <Toggle
        aria-label="hover 상세 설명"
        isSelected={hoverDetailsEnabled}
        onChange={onEnabledChange}
        size="sm"
        variant="outline"
      >
        <MessageSquareText aria-hidden="true" />
        상세 설명 {hoverDetailsEnabled ? "ON" : "OFF"}
      </Toggle>
      <a
        aria-disabled={excelDisabled}
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: `type-control ${
            excelDisabled
              ? "pointer-events-none cursor-not-allowed opacity-45"
              : ""
          }`,
        })}
        href={config.originalExcelUrl ?? undefined}
        onClick={excelDisabled ? (event) => event.preventDefault() : undefined}
        tabIndex={excelDisabled ? -1 : undefined}
        title={
          excelDisabled
            ? "사내 원본 엑셀 링크가 아직 설정되지 않았습니다."
            : undefined
        }
      >
        <FileSpreadsheet aria-hidden="true" />
        원본 엑셀 보기
      </a>
      <a
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: "type-control",
        })}
        download={config.exportFileName}
        href={`./${config.exportFileName}`}
      >
        <Download aria-hidden="true" />
        Download as HTML
      </a>
    </div>
  )
}
