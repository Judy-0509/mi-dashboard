const contexts = ["Total", "USA", "China", "Japan", "Europe", "India"];

let currentMain = null;
let activeContext = "Total";
let scheduled = false;
const wired = new WeakSet();

function setContext(main, context) {
  if (!contexts.includes(context)) return;
  activeContext = context;

  if (context !== "Total") {
    const button = [...main.querySelectorAll(".cp-report-region-tabs button")]
      .find((item) => item.textContent.trim() === context);
    if (button?.getAttribute("aria-selected") !== "true") button?.click();
  }

  schedule();
}

function ensureSummary(main) {
  let summary = main.querySelector(":scope > .cp-weekly-executive");
  if (!summary) {
    summary = document.createElement("section");
    summary.className = "cp-weekly-executive";
    summary.innerHTML = "<h2>Executive Summary</h2><ul></ul>";
    main.append(summary);
  }

  const sourceItems = [...main.querySelectorAll("#cp-weekly .market-list .lead")].slice(0, 2);
  const regionGrowth = [...main.querySelectorAll("#cp-weekly .rollup-line")]
    .map((item) => {
      const text = item.textContent.trim();
      const value = Number(text.match(/[\d.]+/)?.[0]);
      return { text, value: text.includes("△") ? -value : value };
    })
    .filter((item) => Number.isFinite(item.value));
  const leader = regionGrowth.sort((a, b) => b.value - a.value)[0];
  const week = main.querySelector(".cp-report-control-row select")?.value;
  const signature = [...sourceItems.map((item) => item.textContent.trim()), leader?.text, week].join("|");
  if (!signature || summary.dataset.signature === signature) return;

  const list = summary.querySelector("ul");
  list.replaceChildren(...sourceItems.map((source, index) => {
    const item = document.createElement("li");
    item.append(...[...source.childNodes].map((node) => node.cloneNode(true)));
    if (index === 0 && week) item.prepend(`2026 W${week.padStart(2, "0")}까지 `);
    if (index === 1 && leader) {
      const [region, value] = leader.text.split(/\s+/);
      item.append(` ${region}가 누적 YoY ${value}로 가장 높습니다.`);
    }
    return item;
  }));
  summary.dataset.signature = signature;
}

function ensureContextControls(main) {
  const tabs = main.querySelector(".cp-report-region-tabs");
  if (!tabs) return;

  let total = [...tabs.querySelectorAll("button")]
    .find((button) => button.textContent.trim() === "Total");
  if (!total) {
    total = document.createElement("button");
    total.type = "button";
    total.role = "tab";
    total.textContent = "Total";
    tabs.prepend(total);
  }

  for (const button of tabs.querySelectorAll("button")) {
    const selected = button.textContent.trim() === activeContext;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  }
}

function syncMatrix(main) {
  const table = main.querySelector("#cp-matrix table");
  if (!table?.tHead) return;

  const headers = [...table.tHead.rows[0].cells];
  const selectedIndex = headers.findIndex((cell) => cell.textContent.trim() === activeContext);
  headers.slice(1).forEach((cell) => {
    cell.tabIndex = 0;
    cell.setAttribute("role", "button");
    cell.setAttribute("aria-label", `${cell.textContent.trim()} 차트 보기`);
  });

  for (const row of table.rows) {
    [...row.cells].forEach((cell, index) => {
      cell.classList.toggle("weekly-context-column", index === selectedIndex);
    });
  }
}

function layoutSmallLabels(main) {
  for (const svg of main.querySelectorAll(".cp-report-stacked-chart svg")) {
    const groups = new Map();
    for (const label of svg.querySelectorAll(".cp-report-small-label")) {
      const rect = label.parentElement?.querySelector(".cp-report-bar-segment");
      const baseX = rect
        ? Number(rect.getAttribute("x")) + Number(rect.getAttribute("width")) + 9
        : Number(label.getAttribute("x"));
      const labels = groups.get(baseX) ?? [];
      labels.push(label);
      groups.set(baseX, labels);
    }

    for (const [baseX, labels] of groups) {
      labels
        .sort((a, b) => Number(a.getAttribute("y")) - Number(b.getAttribute("y")))
        .forEach((label, index) => {
          const x = baseX + index % 2 * 42;
          label.setAttribute("x", x);
          const line = label.parentElement?.querySelector(".cp-report-label-callout");
          line?.setAttribute("x2", x - 2);
        });
    }
  }
}

function wire(main) {
  if (wired.has(main)) return;
  wired.add(main);

  main.addEventListener("click", (event) => {
    const tab = event.target.closest(".cp-report-region-tabs button");
    if (tab) {
      setContext(main, tab.textContent.trim());
      return;
    }

    const header = event.target.closest("#cp-matrix thead th");
    if (header?.cellIndex > 0) setContext(main, header.textContent.trim());
  });

  main.addEventListener("keydown", (event) => {
    const header = event.target.closest("#cp-matrix thead th");
    if (!header || header.cellIndex < 1 || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    setContext(main, header.textContent.trim());
  });
}

function sync() {
  scheduled = false;
  const main = document.querySelector("#cp-report-main");
  if (!main) {
    currentMain = null;
    return;
  }

  if (main !== currentMain) {
    currentMain = main;
    activeContext = "Total";
  }

  wire(main);
  ensureSummary(main);
  ensureContextControls(main);
  syncMatrix(main);
  layoutSmallLabels(main);
  const contextHeading = main.querySelector("#cp-regional-title");
  if (contextHeading) contextHeading.textContent = "분석 범위";
  main.dataset.weeklyContext = activeContext;
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(sync);
}

function syncAfterInteraction() {
  setTimeout(schedule);
  setTimeout(schedule, 80);
}

document.addEventListener("click", syncAfterInteraction);
document.addEventListener("change", syncAfterInteraction);
document.addEventListener("DOMContentLoaded", syncAfterInteraction);
window.addEventListener("load", syncAfterInteraction);
schedule();
