import { aniModels, type AniModelKey } from "./ani.ts"
import {
  latestResultsAgencyKeys,
  latestResultsAgencyMetadata,
  latestResultsQuarters,
  validateLatestResultsDataset,
  type LatestResultsAgency,
  type LatestResultsDataset,
  type Quarter,
  type ResultCell,
} from "./latest-results.ts"

function makeHistory(value: number) {
  return [
    { monthLabel: "2025-12", value: Number((value - 0.6).toFixed(1)) },
    { monthLabel: "2026-01", value: Number((value - 0.3).toFixed(1)) },
    { monthLabel: "2026-02", value },
  ]
}

function makeCell(
  agencyIndex: number,
  quarterIndex: number,
  modelIndex: number,
): ResultCell {
  if (agencyIndex === 0 && quarterIndex === 0 && modelIndex === 0) {
    return { actual: 8.4, forecast: 8.8, history: [] }
  }
  if (agencyIndex === 0 && quarterIndex === 0 && modelIndex === 1) {
    return { actual: null, forecast: 4.2, history: makeHistory(4.2) }
  }
  if (agencyIndex === 0 && quarterIndex === 0 && modelIndex === 2) {
    return { actual: 0, forecast: null, history: [] }
  }

  const pattern = (agencyIndex + quarterIndex + modelIndex) % 5
  const value = Number(
    (2.5 + agencyIndex * 0.5 + quarterIndex * 0.4 + modelIndex * 0.35).toFixed(1),
  )
  if (pattern === 0) return { actual: value, forecast: null, history: [] }
  if (pattern === 1 || pattern === 2) {
    return { actual: null, forecast: value, history: makeHistory(value) }
  }
  return { actual: null, forecast: null, history: [] }
}

function makeCells(
  agencyIndex: number,
): Record<Quarter, Record<AniModelKey, ResultCell>> {
  return Object.fromEntries(
    latestResultsQuarters.map((quarter, quarterIndex) => [
      quarter,
      Object.fromEntries(
        aniModels.map((model, modelIndex) => [
          model.key,
          makeCell(agencyIndex, quarterIndex, modelIndex),
        ]),
      ),
    ]),
  ) as Record<Quarter, Record<AniModelKey, ResultCell>>
}

const agencies: readonly LatestResultsAgency<AniModelKey>[] =
  latestResultsAgencyKeys.map((key, agencyIndex) => ({
    key,
    ...latestResultsAgencyMetadata[key],
    cells: makeCells(agencyIndex),
  }))

export const latestResultsIPhoneDataset: LatestResultsDataset<AniModelKey> = {
  quarters: latestResultsQuarters,
  agencies,
  rows: aniModels.map(({ key, label, color }) => ({
    key,
    rowKey: key,
    label,
    color,
  })),
  rowKeys: aniModels.map(({ key }) => key),
  rowHeaderLabel: "Model",
  rowHeaderWidthClass: "w-[156px]",
  getRowCell: (agency, quarter, row) => {
    if (row.rowKey === null) {
      return { actual: null, forecast: null, history: [] }
    }
    return agencies.find((item) => item.key === agency)?.cells[quarter][row.rowKey]
      ?? { actual: null, forecast: null, history: [] }
  },
}

validateLatestResultsDataset(latestResultsIPhoneDataset)
