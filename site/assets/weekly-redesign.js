const WEEKLY_TITLE = "Global Smartphone Weekly Sell-out 현황 & Trend";
const WEEKLY_DESCRIPTION = "최근 4년 주간 Sell-out 추이 · 누적 지역/OEM 구성을 M/S와 Mu 기준으로 비교합니다.";
const WEEKLY_REGIONS = ["Total", "USA", "China", "Japan", "Europe", "India"];
const WEEKLY_YEARS = [2023, 2024, 2025, 2026];
const WEEKLY_SELECTED_WEEK = 32;
const WEEKLY_VENDOR_NAMES = ["Apple", "Samsung", "Xiaomi", "OPPO", "vivo", "Honor", "Others"];
const WEEKLY_VENDOR_BASE = {
  USA: [.54, .39, .09, .04, .03, .02, .08],
  China: [.45, .22, .82, .61, .59, .44, .26],
  Japan: [.23, .09, .04, .02, .02, .01, .05],
  Europe: [.42, .39, .31, .18, .16, .11, .21],
  India: [.16, .41, .47, .18, .2, .12, .18],
};
const WEEKLY_CURRENT_FACTOR = {
  USA: [1.08, 1.03, 1.1, .98, 1.02, 1.06, 1.01],
  China: [.96, .91, 1.12, 1.07, 1.09, 1.15, 1.04],
  Japan: [1.05, 1.01, 1.08, 1.04, 1.06, 1.02, 1],
  Europe: [1.04, 1.02, 1.09, 1.01, 1.03, 1.08, 1.02],
  India: [1.1, 1.05, 1.13, 1.06, 1.09, 1.12, 1.05],
};
const WEEKLY_REGION_COLORS = {
  USA: "var(--mi-chart-blue-1)", China: "var(--mi-chart-blue-2)", Japan: "var(--mi-chart-blue-3)",
  Europe: "var(--mi-chart-blue-5)", India: "var(--mi-chart-blue-7)",
};
const WEEKLY_VENDOR_COLORS = {
  Apple: "var(--mi-chart-blue-1)", Samsung: "var(--mi-chart-blue-2)", Xiaomi: "var(--mi-chart-blue-3)",
  OPPO: "var(--mi-chart-blue-4)", vivo: "var(--mi-chart-blue-5)", Honor: "var(--mi-chart-blue-6)", Others: "var(--mi-chart-blue-7)",
};
const WEEKLY_REGION_TONES = { USA: "light", China: "light", Japan: "light", Europe: "dark", India: "dark" };

let weeklyMode = false;
let weeklyCopy = [];
let weeklyData = null;
let weeklyContext = "Total";
let weeklyHeatmapMetric = "yoy";
let sigmaCopy = null;

const round3 = (value) => Math.round(value * 1000) / 1000;
const formatPercent = (value) => value == null ? "N/A" : value < 0 ? `△${Math.abs(value).toFixed(1)}%` : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
const regionsFor = (region) => region === "Total" ? WEEKLY_REGIONS.slice(1) : [region];

function originalWeeklyUnits(year, region, vendorIndex, week) {
  const seasonal = 1 + Math.sin((week + vendorIndex * 2) / 4.5) * .075 + (week > 27 ? .025 : 0);
  const factor = year === 2026 ? WEEKLY_CURRENT_FACTOR[region][vendorIndex] : year === 2023 ? .91 : year === 2024 ? .96 : 1;
  const spike = year === 2026 && week % 7 === vendorIndex ? 1.035 : 1;
  return round3(WEEKLY_VENDOR_BASE[region][vendorIndex] * seasonal * factor * spike);
}

function sumUnits(year, week, region, vendorIndex, throughWeek) {
  const regions = regionsFor(region);
  let total = 0;
  for (const currentRegion of regions) {
    for (let currentWeek = throughWeek ? 1 : week; currentWeek <= week; currentWeek += 1) {
      const vendors = vendorIndex == null ? WEEKLY_VENDOR_NAMES.map((_, index) => index) : [vendorIndex];
      for (const index of vendors) total += originalWeeklyUnits(year, currentRegion, index, currentWeek);
    }
  }
  return total;
}

function metricValue(week, region, vendorIndex, mode) {
  if (mode === "wow" && week <= 1) return null;
  const current = mode === "yoy"
    ? sumUnits(2026, week, region, vendorIndex, true)
    : sumUnits(2026, week, region, vendorIndex, false);
  const previous = mode === "yoy"
    ? sumUnits(2025, week, region, vendorIndex, true)
    : sumUnits(2026, week - 1, region, vendorIndex, false);
  return previous === 0 ? null : Math.round((current / previous - 1) * 1000) / 10;
}

function buildHeatmap(week, mode) {
  const labels = ["Total", ...WEEKLY_VENDOR_NAMES];
  return {
    headers: WEEKLY_REGIONS,
    rows: labels.map((label) => {
      const vendorIndex = label === "Total" ? null : WEEKLY_VENDOR_NAMES.indexOf(label);
      return { label, values: WEEKLY_REGIONS.map((region) => formatPercent(metricValue(week, region, vendorIndex, mode))) };
    }),
  };
}

function buildCumulative(region) {
  const names = region === "Total" ? WEEKLY_REGIONS.slice(1) : WEEKLY_VENDOR_NAMES;
  const years = WEEKLY_YEARS.map((year) => {
    const weekEnd = WEEKLY_SELECTED_WEEK;
    const segments = names.map((name) => {
      const value = region === "Total"
        ? sumUnits(year, weekEnd, name, null, true)
        : sumUnits(year, weekEnd, region, WEEKLY_VENDOR_NAMES.indexOf(name), true);
      return {
        name,
        value: round3(value),
        color: region === "Total" ? WEEKLY_REGION_COLORS[name] : WEEKLY_VENDOR_COLORS[name],
        tone: region === "Total" ? WEEKLY_REGION_TONES[name] : "dark",
      };
    });
    return { year, total: round3(segments.reduce((sum, segment) => sum + segment.value, 0)), segments };
  });
  return { years, segments: names };
}

function buildWeeklyData() {
  const cumulative = Object.fromEntries(WEEKLY_REGIONS.map((region) => [region, buildCumulative(region)]));
  return { heatmap: { yoy: buildHeatmap(WEEKLY_SELECTED_WEEK, "yoy"), wow: buildHeatmap(WEEKLY_SELECTED_WEEK, "wow") }, cumulative };
}

function buildWeeklyCopy() {
  const totalYoy = metricValue(WEEKLY_SELECTED_WEEK, "Total", null, "yoy");
  const totalWow = metricValue(WEEKLY_SELECTED_WEEK, "Total", null, "wow");
  const leader = WEEKLY_REGIONS.slice(1).map((region) => ({ region, value: metricValue(WEEKLY_SELECTED_WEEK, region, null, "yoy") }))
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))[0];
  return [
    `2026 W${String(WEEKLY_SELECTED_WEEK).padStart(2, "0")}: 누적 판매 YoY ${formatPercent(totalYoy)}로 성장 흐름 유지함`,
    `단주 WoW ${formatPercent(totalWow)}; ${leader?.region || "지역별 모멘텀"} ${formatPercent(leader?.value)} 확인 필요`,
  ];
}

function captureSigmaCopy(page) {
  if (sigmaCopy || !page?.classList.contains("sigma")) return;
  sigmaCopy = {
    title: page.querySelector(".dashboard-page-title")?.textContent ?? "",
    description: page.querySelector(".dashboard-page-description")?.textContent ?? "",
    summary: [...page.querySelectorAll(".sigma-summary-list > span")].map((item) => item.innerHTML),
  };
}

function applyWeeklyCopy(page) {
  if (!page?.classList.contains("sigma")) return;
  captureSigmaCopy(page);
  const title = page.querySelector(".dashboard-page-title");
  const description = page.querySelector(".dashboard-page-description");
  if (title) title.textContent = WEEKLY_TITLE;
  if (description) description.textContent = WEEKLY_DESCRIPTION;
  page.querySelectorAll(".sigma-summary-list > span").forEach((item, index) => {
    if (weeklyCopy[index]) item.textContent = weeklyCopy[index];
  });
}

function restoreSigmaCopy(page) {
  if (!page?.classList.contains("sigma") || !sigmaCopy) return;
  const title = page.querySelector(".dashboard-page-title");
  const description = page.querySelector(".dashboard-page-description");
  if (title) title.textContent = sigmaCopy.title;
  if (description) description.textContent = sigmaCopy.description;
  page.querySelectorAll(".sigma-summary-list > span").forEach((item, index) => {
    if (sigmaCopy.summary[index] !== undefined) item.innerHTML = sigmaCopy.summary[index];
  });
}

function renderWeeklyCumulative(row) {
  const svg = row.querySelector(".weekly-cumulative-svg");
  const legend = row.querySelector(".weekly-cumulative-legend");
  const data = weeklyData?.cumulative?.[weeklyContext];
  if (!svg || !legend || !data) return;
  const max = Math.max(...data.years.map((year) => year.total), 1);
  const baseline = 214;
  const height = 180;
  const x = (index) => 54 + index * 92;
  const width = 54;
  const y = (value) => baseline - (value / max) * height;
  svg.replaceChildren();
  svg.setAttribute("aria-label", `${weeklyContext} 4-year cumulative stacked bar chart`);
  [0, .5, 1].forEach((fraction) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", 38); line.setAttribute("x2", 410); line.setAttribute("y1", y(max * fraction)); line.setAttribute("y2", y(max * fraction));
    line.classList.add("weekly-cumulative-grid"); svg.append(line);
  });
  const axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  axis.setAttribute("x1", 38); axis.setAttribute("x2", 410); axis.setAttribute("y1", baseline); axis.setAttribute("y2", baseline);
  axis.classList.add("weekly-cumulative-axis"); svg.append(axis);
  data.years.forEach((year, yearIndex) => {
    let cursor = baseline;
    year.segments.forEach((segment) => {
      const segmentHeight = (segment.value / max) * height;
      cursor -= segmentHeight;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x(yearIndex)); rect.setAttribute("y", cursor); rect.setAttribute("width", width); rect.setAttribute("height", segmentHeight);
      rect.setAttribute("fill", segment.color); rect.classList.add("weekly-cumulative-segment"); svg.append(rect);
      if (segmentHeight >= 18) {
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", x(yearIndex) + width / 2); label.setAttribute("y", cursor + segmentHeight / 2 + 4); label.setAttribute("text-anchor", "middle");
        label.textContent = segment.value.toFixed(1); label.classList.add("weekly-cumulative-segment-label", segment.tone); svg.append(label);
      }
    });
    const total = document.createElementNS("http://www.w3.org/2000/svg", "text");
    total.setAttribute("x", x(yearIndex) + width / 2); total.setAttribute("y", y(year.total) - 8); total.setAttribute("text-anchor", "middle");
    total.textContent = `${year.total.toFixed(1)} Mu`; total.classList.add("weekly-cumulative-total"); svg.append(total);
    const yearLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yearLabel.setAttribute("x", x(yearIndex) + width / 2); yearLabel.setAttribute("y", baseline + 24); yearLabel.setAttribute("text-anchor", "middle");
    yearLabel.textContent = String(year.year); yearLabel.classList.add("weekly-cumulative-year"); svg.append(yearLabel);
  });
  legend.replaceChildren(...data.segments.map((name, index) => {
    const item = document.createElement("span"); const swatch = document.createElement("i"); const label = document.createElement("em");
    swatch.style.background = data.years[0].segments[index].color; label.textContent = name; item.append(swatch, label); return item;
  }));
}

function renderWeeklyAnalysis(page) {
  if (!weeklyData || !page?.classList.contains("sigma")) return;
  let row = page.querySelector(":scope > .weekly-analysis-row");
  if (!row) {
    row = document.createElement("section"); row.className = "weekly-analysis-row"; row.setAttribute("aria-label", "Weekly regional analysis");
    const heatmap = document.createElement("article"); heatmap.className = "weekly-analysis-card weekly-heatmap-card";
    const cumulative = document.createElement("article"); cumulative.className = "weekly-analysis-card weekly-cumulative-card";
    row.append(heatmap, cumulative);
    const sigmaGrid = page.querySelector(":scope > .sigma-grid"); if (sigmaGrid) page.insertBefore(row, sigmaGrid);
  }
  const heatmap = row.querySelector(".weekly-heatmap-card");
  if (!heatmap.querySelector(".weekly-heatmap-metrics")) {
    const head = document.createElement("div"); head.className = "weekly-analysis-head";
    head.innerHTML = "<div><span class=\"kicker\">WEEKLY MARKET MIX</span><h3>Vendor × Region heatmap</h3></div>";
    const metrics = document.createElement("div"); metrics.className = "weekly-heatmap-metrics"; metrics.setAttribute("role", "group"); metrics.setAttribute("aria-label", "Heatmap metric");
    ["yoy", "wow"].forEach((metric) => { const button = document.createElement("button"); button.type = "button"; button.className = "weekly-heatmap-metric"; button.dataset.metric = metric; button.textContent = metric === "yoy" ? "YoY (%)" : "WoW (%)"; metrics.append(button); });
    head.append(metrics); const wrap = document.createElement("div"); wrap.className = "weekly-heatmap-wrap"; const table = document.createElement("table"); table.setAttribute("aria-label", "Vendor by region weekly heatmap"); wrap.append(table); heatmap.append(head, wrap);
  }
  const table = heatmap.querySelector("table"); const metricData = weeklyData.heatmap[weeklyHeatmapMetric]; table.replaceChildren();
  table.createTHead().insertRow().append(...["Vendor", ...metricData.headers].map((label) => { const cell = document.createElement("th"); cell.scope = "col"; cell.textContent = label; return cell; }));
  const body = table.createTBody();
  metricData.rows.forEach(({ label, values }) => body.insertRow().append(...[label, ...values].map((value, index) => { const cell = document.createElement(index === 0 ? "th" : "td"); if (index === 0) cell.scope = "row"; if (index > 0) cell.classList.add(value.includes("△") || value.includes("-") ? "down" : "up"); cell.textContent = value; return cell; })));
  heatmap.querySelectorAll(".weekly-heatmap-metric").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.metric === weeklyHeatmapMetric)));

  const cumulative = row.querySelector(".weekly-cumulative-card");
  if (!cumulative.querySelector(".weekly-region-controls")) {
    const head = document.createElement("div"); head.className = "weekly-analysis-head weekly-cumulative-head"; head.innerHTML = "<div><span class=\"kicker\">CUMULATIVE SELL-OUT</span><h3>4-year cumulative composition</h3></div>";
    const controls = document.createElement("div"); controls.className = "weekly-region-controls"; controls.setAttribute("role", "group"); controls.setAttribute("aria-label", "Cumulative context selector");
    WEEKLY_REGIONS.forEach((region) => { const toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "weekly-region-toggle"; toggle.dataset.region = region; toggle.innerHTML = `<i aria-hidden=\"true\"></i><span>${region}</span>`; controls.append(toggle); });
    head.append(controls); const plot = document.createElement("div"); plot.className = "weekly-cumulative-body"; plot.innerHTML = "<svg class=\"weekly-cumulative-svg\" viewBox=\"0 0 430 250\" role=\"img\"></svg><div class=\"weekly-cumulative-legend\" aria-label=\"Cumulative composition legend\"></div>"; cumulative.append(head, plot);
  }
  cumulative.querySelectorAll(".weekly-region-toggle").forEach((button) => { const region = button.dataset.region; button.setAttribute("aria-pressed", String(region === weeklyContext)); button.classList.toggle("active", region === weeklyContext); });
  renderWeeklyCumulative(row);
}

function setNavigationState() {
  document.querySelectorAll(".nav-provider").forEach((provider) => {
    const name = provider.querySelector(":scope > span")?.textContent.trim();
    const open = weeklyMode ? name === "Counterpoint" : name === "SigmaIntel";
    provider.classList.toggle("open", open);
    provider.querySelector(".nav-series")?.classList.toggle("open", open);
  });
  document.querySelectorAll(".nav-series button").forEach((button) => {
    const label = button.textContent.trim();
    const selected = weeklyMode ? label === "Weekly" : label === "Production Forecast";
    button.classList.toggle("active", selected); if (!button.disabled) button.setAttribute("aria-pressed", String(selected));
  });
}

function currentSigmaPage() { return document.querySelector(".portal-content > section.sigma"); }

function activateWeekly() {
  const page = currentSigmaPage(); if (!page) return;
  if (!weeklyMode) { weeklyMode = true; weeklyContext = "Total"; weeklyHeatmapMetric = "yoy"; }
  weeklyData ||= buildWeeklyData(); weeklyCopy = buildWeeklyCopy(); applyWeeklyCopy(page); renderWeeklyAnalysis(page); setNavigationState();
}

function activateSigma() {
  const page = currentSigmaPage(); if (!page) return;
  weeklyMode = false; restoreSigmaCopy(page); page.querySelector(":scope > .weekly-analysis-row")?.remove(); setNavigationState();
}

function queueWeeklyHandoff() {
  if (!weeklyMode) return;
  queueMicrotask(() => { if (weeklyMode) activateWeekly(); });
}

function handleNavIntent(event) {
  const button = event.target.closest?.(".nav-series button");
  if (!button) return;
  const label = button.textContent.trim(); if (label !== "Weekly" && label !== "Production Forecast") return;
  event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
  if (label === "Weekly") activateWeekly(); else activateSigma();
}

document.addEventListener("click", handleNavIntent, true);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  handleNavIntent(event);
}, true);
document.addEventListener("click", (event) => {
  const toggle = event.target.closest?.(".weekly-region-toggle");
  const metric = event.target.closest?.(".weekly-heatmap-metric");
  const page = currentSigmaPage();
  if (toggle && page && weeklyMode) { weeklyContext = toggle.dataset.region; renderWeeklyAnalysis(page); }
  if (metric && page && weeklyMode) { weeklyHeatmapMetric = metric.dataset.metric; renderWeeklyAnalysis(page); }
  queueWeeklyHandoff();
}, false);
document.addEventListener("change", queueWeeklyHandoff, false);
document.addEventListener("DOMContentLoaded", () => { weeklyData = buildWeeklyData(); weeklyCopy = buildWeeklyCopy(); setNavigationState(); });
window.addEventListener("load", () => { weeklyData ||= buildWeeklyData(); weeklyCopy ||= buildWeeklyCopy(); setNavigationState(); });
