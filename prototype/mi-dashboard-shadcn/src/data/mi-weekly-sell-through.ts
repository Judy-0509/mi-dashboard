import type { WeeklyRegion } from "./weekly.ts"

export const miWeeklySellThroughDetails: Record<
  WeeklyRegion,
  readonly string[]
> = {
  Total: [
    "글로벌 누적 Sell-out 성장 흐름을 유지",
    "단주 흐름은 보합권으로 전환",
    "지역별 성장 편차를 함께 확인할 필요",
  ],
  USA: [
    "누적 Sell-out은 견조한 성장세",
    "단주 흐름은 전주 대비 개선",
  ],
  China: [
    "누적 성장률은 전체 평균을 상회",
    "단주 Sell-out은 전주 대비 조정",
    "지역 내 업체별 움직임을 추가 확인",
  ],
  Japan: [
    "누적 성장세는 완만하게 유지",
    "단주 Sell-out은 소폭 반등",
  ],
  Europe: [
    "누적 Sell-out은 안정적인 성장 흐름",
    "단주 흐름은 전주와 유사한 수준",
  ],
  India: [
    "누적 성장률이 지역 중 가장 높음",
    "단주 Sell-out은 전주 대비 보합",
    "성장 기여도와 지속성 모니터링 필요",
  ],
}
