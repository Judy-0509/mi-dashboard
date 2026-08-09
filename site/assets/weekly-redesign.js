const WEEKLY_TITLE = "Global Smartphone Weekly Sell-out 현황 & Trend";
const WEEKLY_DESCRIPTION = "최근 4년 주간 Sell-out 추이 · 누적 지역/OEM 구성을 M/S와 Mu 기준으로 비교합니다.";

let scheduled = false;
let weeklyMode = false;
let switchingToSigma = false;
let weeklyCopy = null;
let sigmaCopy = null;

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
  if (!button || switchingToSigma) return;
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
    if (!switchingToSigma) requestSigmaView();
    return;
  }

  if (page?.classList.contains("sigma")) {
    if (weeklyMode) applyWeeklyCopy(page);
    else restoreSigmaCopy(page);
    setNavigationState();
  }
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(sync);
}

document.addEventListener("click", (event) => {
  const button = event.target.closest(".nav-series button");
  if (button && !switchingToSigma) {
    weeklyMode = button.textContent.trim() === "Weekly";
    if (weeklyMode) weeklyCopy = null;
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
