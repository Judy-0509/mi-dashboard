const WEEKLY_TITLE = "Global Smartphone Weekly Sell-out 현황 & Trend";
const WEEKLY_DESCRIPTION = "최근 4년 주간 Sell-out 추이 · 누적 지역/OEM 구성을 M/S와 Mu 기준으로 비교합니다.";
const WEEKLY_REGIONS = ["Total", "USA", "China", "Japan", "Europe", "India"];
const WEEKLY_REGION_COLORS = {
  Total: "var(--mi-color-primary-deep)",
  USA: "var(--mi-chart-blue-2)",
  China: "var(--mi-chart-blue-3)",
  Japan: "var(--mi-chart-blue-4)",
  Europe: "var(--mi-chart-blue-5)",
  India: "var(--mi-chart-blue-6)",
};

let scheduled = false;
let weeklyMode = false;
let switchingToSigma = false;
let weeklyCaptureGeneration = 0;
let activeWeeklyCapture = null;
let weeklyCopy = null;
let weeklyData = null;
let weeklySelection = new Set(WEEKLY_REGIONS);
let sigmaCopy = null;

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

function ensureSummary(main) {
  let summary = main.querySelector(":scope > .cp-weekly-executive");
  if (!summary) {
    summary = document.createElement("section");
    summary.className = "cp-weekly-executive";
    summary.innerHTML = "<h2>Executive Summary</h2><ul></ul>";
    main.append(summary);
  }

  const sourceItems = [...main.querySelectorAll("#cp-weekly .market-list .lead")].slice(0, 2);
  const week = main.querySelector(".cp-report-control-row select")?.value;
  const regionGrowth = [...main.querySelectorAll("#cp-weekly .rollup-line")]
    .map((item) => {
      const text = item.textContent.trim();
      const value = Number(text.match(/[\d.]+/)?.[0]);
      return { text, value: text.includes("-") ? -value : value };
    })
    .filter((item) => Number.isFinite(item.value))
    .sort((a, b) => b.value - a.value);
  const leader = regionGrowth[0];
  const signature = [...sourceItems.map((item) => item.textContent.trim()), leader?.text, week].join("|");
  if (!signature || summary.dataset.signature === signature) return summary;

  const list = summary.querySelector("ul");
  list.replaceChildren(...sourceItems.map((source, index) => {
    const item = document.createElement("li");
    const text = source.textContent.trim();
    item.textContent = index === 0 && week
      ? `2026 W${week.padStart(2, "0")}: ${text}`
      : text;
    if (index === 1 && leader) item.textContent += ` ${leader.text}`;
    return item;
  }));
  summary.dataset.signature = signature;
  return summary;
}

function captureWeeklyCopy(main) {
  const summary = ensureSummary(main);
  const items = [...summary.querySelectorAll("li")].map((item) => item.textContent.trim()).filter(Boolean);
  weeklyCopy = items.slice(0, 2);
  if (!weeklyCopy.length) weeklyCopy = ["Weekly sell-out 흐름을 확인하세요.", "지역 및 OEM별 구성 변화를 비교하세요."];
}

function readTrend(svg) {
  const values = [...(svg?.querySelectorAll(".cp-report-point.year-2026 .cp-report-hover-value") || [])]
    .slice(0, 32)
    .map((item) => Number(item.textContent.match(/[\d.]+(?=\s*Mu)/)?.[0]));
  return values.length === 32 && values.every((value) => Number.isFinite(value)) ? values : null;
}

function readHeatmap(main) {
  const table = main.querySelector("#cp-matrix table");
  if (!table) return null;
  const headers = [...table.tHead?.rows[0]?.cells || []].slice(1).map((cell) => cell.textContent.trim());
  const rows = [...table.tBodies[0]?.rows || []]
    .map((row) => [...row.cells].map((cell) => cell.textContent.trim()))
    .filter((row) => row.length === headers.length + 1)
    .map(([label, ...values]) => ({ label, values }));
  const labels = rows.map((row) => row.label);
  if (headers.length !== WEEKLY_REGIONS.length || !headers.every((header, index) => header === WEEKLY_REGIONS[index])) return null;
  if (rows.length !== 8 || labels.some((label) => !label) || new Set(labels).size !== 8) return null;
  if (rows.some((row) => row.values.length !== 6 || row.values.some((value) => !value))) return null;
  return { headers, rows };
}

async function waitForTrend(main, region, token) {
  for (let elapsed = 0; elapsed <= 1600; elapsed += 40) {
    if (token !== weeklyCaptureGeneration || !weeklyMode || !main.isConnected || document.querySelector("#cp-report-main") !== main) return null;
    const button = [...main.querySelectorAll(".cp-report-region-tabs button")]
      .find((item) => item.textContent.trim() === region);
    if (!button) return null;
    if (button.getAttribute("aria-selected") === "true") {
      const values = readTrend(main.querySelector("#cp-regional svg"));
      if (values) return values;
    }
    await wait(40);
  }
  return null;
}

async function captureWeeklyData(main) {
  if (weeklyData) return false;
  const token = weeklyCaptureGeneration;
  const capture = { generation: token, main };
  if (activeWeeklyCapture?.generation === token && activeWeeklyCapture.main === main) return false;
  activeWeeklyCapture = capture;
  try {
    if (!weeklyMode || !main.isConnected || document.querySelector("#cp-report-main") !== main) return false;
    const total = readTrend(main.querySelector("#cp-overall svg"));
    if (!total) return false;
    const trends = { Total: total };
    for (const region of WEEKLY_REGIONS.slice(1)) {
      const button = [...main.querySelectorAll(".cp-report-region-tabs button")]
        .find((item) => item.textContent.trim() === region);
      if (!button) return false;
      button.click();
      const values = await waitForTrend(main, region, token);
      if (!values) return false;
      trends[region] = values;
    }
    const usa = [...main.querySelectorAll(".cp-report-region-tabs button")]
      .find((item) => item.textContent.trim() === "USA");
    if (!usa) return false;
    usa.click();
    if (!(await waitForTrend(main, "USA", token))) return false;
    if (token !== weeklyCaptureGeneration || !weeklyMode || !main.isConnected || document.querySelector("#cp-report-main") !== main) return false;
    const heatmap = readHeatmap(main);
    if (!heatmap) return false;
    weeklyData = { trends, heatmap };
    return true;
  } finally {
    if (activeWeeklyCapture === capture) activeWeeklyCapture = null;
    if (token !== weeklyCaptureGeneration && weeklyMode && main.isConnected && document.querySelector("#cp-report-main") === main) schedule();
  }
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

  const summaryItems = page.querySelectorAll(".sigma-summary-list > span");
  (weeklyCopy || []).slice(0, 2).forEach((text, index) => {
    if (summaryItems[index]) summaryItems[index].textContent = text;
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

function formatRange(values) {
  const all = values.flatMap((value) => value);
  const min = Math.min(...all);
  const max = Math.max(...all);
  return [Number.isFinite(min) ? min : 0, Number.isFinite(max) ? max : 1];
}

function renderWeeklyTrend(row) {
  const svg = row.querySelector(".weekly-trend-svg");
  const legend = row.querySelector(".weekly-trend-legend");
  if (!svg || !legend || !weeklyData) return;
  const selected = WEEKLY_REGIONS.filter((region) => weeklySelection.has(region));
  const visible = selected.length ? selected : ["Total"];
  const series = visible.map((region) => weeklyData.trends[region] || []);
  const [minimum, maximum] = formatRange(series);
  const lower = Math.floor((minimum * 0.98) * 10) / 10;
  const upper = Math.ceil((maximum * 1.02) * 10) / 10;
  const span = Math.max(0.1, upper - lower);
  const left = 44;
  const top = 16;
  const width = 548;
  const height = 162;
  const x = (index) => left + (index / 31) * width;
  const y = (value) => top + (1 - (value - lower) / span) * height;

  svg.replaceChildren();
  svg.setAttribute("aria-label", `Weekly W1–W32 country trend: ${visible.join(", ")}`);
  [0, 0.5, 1].forEach((fraction) => {
    const value = upper - span * fraction;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", left);
    line.setAttribute("x2", left + width);
    line.setAttribute("y1", y(value));
    line.setAttribute("y2", y(value));
    line.classList.add("weekly-trend-grid");
    svg.append(line);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", left - 8);
    label.setAttribute("y", y(value) + 4);
    label.setAttribute("text-anchor", "end");
    label.textContent = `${value.toFixed(1)} Mu`;
    label.classList.add("weekly-trend-axis-label");
    svg.append(label);
  });
  const axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
  axis.setAttribute("x1", left);
  axis.setAttribute("x2", left + width);
  axis.setAttribute("y1", top + height);
  axis.setAttribute("y2", top + height);
  axis.classList.add("weekly-trend-axis");
  svg.append(axis);
  [0, 15, 31].forEach((index) => {
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x(index));
    label.setAttribute("y", top + height + 24);
    label.setAttribute("text-anchor", index === 0 ? "start" : index === 31 ? "end" : "middle");
    label.textContent = `W${index + 1}`;
    label.classList.add("weekly-trend-axis-label");
    svg.append(label);
  });
  visible.forEach((region) => {
    const values = weeklyData.trends[region] || [];
    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("points", values.map((value, index) => `${x(index)},${y(value)}`).join(" "));
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", WEEKLY_REGION_COLORS[region]);
    line.classList.add("weekly-trend-line");
    svg.append(line);
  });
  legend.replaceChildren(...visible.map((region) => {
    const item = document.createElement("span");
    const swatch = document.createElement("i");
    swatch.style.background = WEEKLY_REGION_COLORS[region];
    const label = document.createElement("em");
    label.textContent = region;
    item.append(swatch, label);
    return item;
  }));
}

function renderWeeklyAnalysis(page) {
  if (!weeklyData) return;
  let row = page.querySelector(":scope > .weekly-analysis-row");
  if (!row) {
    row = document.createElement("section");
    row.className = "weekly-analysis-row";
    row.setAttribute("aria-label", "Weekly regional analysis");
    const heatmap = document.createElement("article");
    heatmap.className = "weekly-analysis-card weekly-heatmap-card";
    const trend = document.createElement("article");
    trend.className = "weekly-analysis-card weekly-trend-card";
    row.append(heatmap, trend);
    const sigmaGrid = page.querySelector(":scope > .sigma-grid");
    if (sigmaGrid) page.insertBefore(row, sigmaGrid);
  }

  const heatmap = row.querySelector(".weekly-heatmap-card");
  if (!heatmap.querySelector("table")) {
    const head = document.createElement("div");
    head.className = "weekly-analysis-head";
    head.innerHTML = "<div><span class=\"kicker\">WEEKLY MARKET MIX</span><h3>Vendor × Region heatmap</h3></div><span class=\"weekly-analysis-meta\">W1–W32 · YoY</span>";
    const wrap = document.createElement("div");
    wrap.className = "weekly-heatmap-wrap";
    const table = document.createElement("table");
    table.setAttribute("aria-label", "Vendor by region weekly YoY heatmap");
    const headers = ["Vendor", ...(weeklyData.heatmap.headers.length ? weeklyData.heatmap.headers : WEEKLY_REGIONS)];
    table.createTHead().insertRow().append(...headers.map((label) => {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = label;
      return cell;
    }));
    const body = table.createTBody();
    weeklyData.heatmap.rows.forEach(({ label, values }) => {
      const cells = [label, ...values].map((value, index) => {
        const cell = document.createElement(index === 0 ? "th" : "td");
        if (index === 0) cell.scope = "row";
        if (index > 0) cell.classList.add(value.includes("△") || value.includes("-") ? "down" : "up");
        cell.textContent = value;
        return cell;
      });
      body.insertRow().append(...cells);
    });
    wrap.append(table);
    heatmap.append(head, wrap);
  }

  const trend = row.querySelector(".weekly-trend-card");
  if (!trend.querySelector(".weekly-region-controls")) {
    const head = document.createElement("div");
    head.className = "weekly-analysis-head weekly-trend-head";
    head.innerHTML = "<div><span class=\"kicker\">WEEKLY TREND</span><h3>Country trend · W1–W32</h3></div>";
    const controls = document.createElement("div");
    controls.className = "weekly-region-controls";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", "Country trend selector");
    const all = document.createElement("button");
    all.type = "button";
    all.className = "weekly-region-all";
    all.textContent = "전체 선택";
    all.setAttribute("aria-label", "모든 지역 비교");
    all.setAttribute("aria-pressed", "true");
    controls.append(all);
    WEEKLY_REGIONS.forEach((region) => {
      const group = document.createElement("span");
      group.className = "weekly-region-control";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "weekly-region-toggle";
      toggle.dataset.region = region;
      toggle.setAttribute("aria-pressed", "true");
      toggle.innerHTML = `<i aria-hidden=\"true\"></i><span>${region}</span>`;
      const only = document.createElement("button");
      only.type = "button";
      only.className = "weekly-region-only";
      only.dataset.region = region;
      only.textContent = "ONLY";
      only.setAttribute("aria-label", `${region}만 비교`);
      group.append(toggle, only);
      controls.append(group);
    });
    head.append(controls);
    const plot = document.createElement("div");
    plot.className = "weekly-trend-plot";
    plot.innerHTML = "<svg class=\"weekly-trend-svg\" viewBox=\"0 0 640 230\" role=\"img\"></svg><div class=\"weekly-trend-legend\" aria-label=\"Selected country legend\"></div>";
    trend.append(head, plot);
  }
  trend.querySelectorAll(".weekly-region-toggle").forEach((button) => {
    const region = button.dataset.region;
    button.setAttribute("aria-pressed", String(weeklySelection.has(region)));
    button.classList.toggle("active", weeklySelection.has(region));
  });
  const all = trend.querySelector(".weekly-region-all");
  all?.classList.toggle("active", weeklySelection.size === WEEKLY_REGIONS.length);
  all?.setAttribute("aria-pressed", String(weeklySelection.size === WEEKLY_REGIONS.length));
  renderWeeklyTrend(row);
}

function setNavigationState() {
  document.querySelectorAll(".nav-series button").forEach((button) => {
    const isWeekly = button.textContent.trim() === "Weekly";
    const selected = weeklyMode ? isWeekly : !isWeekly && button.textContent.trim() === "Production Forecast";
    button.classList.toggle("active", selected);
    if (!button.disabled) button.setAttribute("aria-pressed", String(selected));
  });
}

function requestSigmaView() {
  const button = [...document.querySelectorAll(".nav-series button")]
    .find((item) => item.textContent.trim() === "Production Forecast");
  if (!button || switchingToSigma || activeWeeklyCapture?.generation === weeklyCaptureGeneration) return;
  switchingToSigma = true;
  button.click();
  window.setTimeout(() => {
    switchingToSigma = false;
    schedule();
  }, 0);
}

function sync() {
  scheduled = false;
  const weeklyMain = document.querySelector("#cp-report-main");
  const page = weeklyMain?.classList.contains("counterpoint-weekly")
    ? weeklyMain
    : document.querySelector(".portal-content > section");

  if (page?.classList.contains("counterpoint-weekly")) {
    captureWeeklyCopy(weeklyMain);
    if (!weeklyData && activeWeeklyCapture?.generation !== weeklyCaptureGeneration) {
      captureWeeklyData(weeklyMain).then((captured) => { if (captured) schedule(); });
    } else if (!switchingToSigma) requestSigmaView();
    return;
  }

  if (page?.classList.contains("sigma")) {
    if (weeklyMode) {
      applyWeeklyCopy(page);
      renderWeeklyAnalysis(page);
    } else {
      restoreSigmaCopy(page);
      page.querySelector(".weekly-analysis-row")?.remove();
    }
    setNavigationState();
  }
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(sync);
}

document.addEventListener("click", (event) => {
  const navButton = event.target.closest(".nav-series button");
  if (navButton && !switchingToSigma) {
    weeklyCaptureGeneration += 1;
    weeklyData = null;
    weeklyMode = navButton.textContent.trim() === "Weekly";
    if (weeklyMode) {
      weeklySelection = new Set(WEEKLY_REGIONS);
    }
  }
  const toggle = event.target.closest(".weekly-region-toggle");
  const only = event.target.closest(".weekly-region-only");
  const all = event.target.closest(".weekly-region-all");
  if (toggle) {
    const region = toggle.dataset.region;
    if (weeklySelection.has(region)) {
      if (weeklySelection.size > 1) weeklySelection.delete(region);
    } else {
      weeklySelection.add(region);
    }
    renderWeeklyTrend(toggle.closest(".weekly-analysis-row"));
  } else if (only) {
    weeklySelection = new Set([only.dataset.region]);
    renderWeeklyAnalysis(only.closest(".portal-content > section"));
  } else if (all) {
    weeklySelection = new Set(WEEKLY_REGIONS);
    renderWeeklyAnalysis(all.closest(".portal-content > section"));
  }
  schedule();
  window.setTimeout(schedule, 80);
  window.setTimeout(schedule, 160);
});
document.addEventListener("change", () => {
  schedule();
  window.setTimeout(schedule, 80);
  window.setTimeout(schedule, 160);
});
document.addEventListener("DOMContentLoaded", schedule);
window.addEventListener("load", schedule);
schedule();
