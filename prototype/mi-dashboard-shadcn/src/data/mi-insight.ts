export type MiInsightReport = {
  fileName: string
  researchProvider: string
  useCase: string
  cadence: string
  uploadDate: string
  sharedContent: string
  edmUrl: string | null
}

export type MiInsightInsight = {
  title: string
  details: readonly string[]
}

export const miInsightInsights: readonly MiInsightInsight[] = [
  {
    title: "5G 중심 수요 회복",
    details: [
      "중저가 5G와 신흥 시장이 글로벌 스마트폰 출하 회복을 견인함",
      "프리미엄 수요는 견조하지만 교체 주기 연장으로 전체 성장 폭은 제한적임",
    ],
  },
  {
    title: "지역별 회복 온도차",
    details: [
      "북미와 인도 수요가 출하를 지지하고 중국 내수도 전년 대비 회복 흐름을 보임",
    ],
  },
  {
    title: "원가와 환율 관리 필요",
    details: [
      "하반기 메모리 원가와 환율이 제조사 수익성의 핵심 변수로 작용할 전망임",
    ],
  },
]

export const miInsightReports: readonly MiInsightReport[] = [
  {
    fileName: "Global Smartphone Weekly Tracker_2026W32.xlsx",
    researchProvider: "Counterpoint",
    useCase: "글로벌 출하·판매 추이",
    cadence: "주간",
    uploadDate: "2026-08-10",
    sharedContent:
      "북미와 인도 중심의 5G 수요가 전체 출하를 지지했으며, 중국 내수는 전년 대비 회복 흐름을 보였습니다.",
    edmUrl: "https://example.com/mi-insight/2026w32",
  },
  {
    fileName: "Smartphone Component Cost Monitor_2026W31.xlsx",
    researchProvider: "SigmaIntel",
    useCase: "부품 원가·수익성",
    cadence: "주간",
    uploadDate: "2026-08-03",
    sharedContent:
      "메모리와 디스플레이 원가가 소폭 상승했지만, 프리미엄 모델의 부품 믹스 개선으로 영향을 일부 상쇄했습니다.",
    edmUrl: null,
  },
  {
    fileName: "China Smartphone Channel Check_2026-07.xlsx",
    researchProvider: "IDC",
    useCase: "중국 유통 채널",
    cadence: "월간",
    uploadDate: "2026-07-31",
    sharedContent:
      "온라인 채널의 프로모션이 강화되면서 중가형 수요가 늘었고, 현지 브랜드 간 점유율 경쟁은 이어졌습니다.",
    edmUrl: "https://example.com/mi-insight/2026-07-channel",
  },
]

export function getMiInsightReports(): MiInsightReport[] {
  return [...miInsightReports].sort((left, right) =>
    right.uploadDate.localeCompare(left.uploadDate)
  )
}
