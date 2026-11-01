import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const failures = [];

function check(name, ok, detail = "") {
  if (!ok) failures.push(`${name}${detail ? `: ${detail}` : ""}`);
}

async function textIssues(page) {
  return page.evaluate(() => {
    const small = [];
    const dashes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.textContent ?? "";
      if (!text.trim()) continue;
      if (text.includes("\u2014") || text.includes("\u2013")) dashes.push(text.trim().slice(0, 80));
      const el = node.parentElement;
      if (!el) continue;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const rects = el.getClientRects();
      if (rects.length === 0) continue;
      const size = parseFloat(style.fontSize);
      if (size < 13) small.push({ text: text.trim().slice(0, 60), size, tag: el.tagName });
    }
    return {
      small,
      dashes,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    };
  });
}

async function animations(page) {
  return page.evaluate(() => {
    const dots = Array.from(document.querySelectorAll("[data-orbit-dot]"));
    const durations = dots.map((dot) => {
      const value = getComputedStyle(dot).animationDuration;
      const seconds = value.split(",").map((part) => parseFloat(part));
      return seconds;
    });
    const running = document.getAnimations().filter((item) => item.playState === "running");
    return { dotCount: dots.length, durations, running: running.length };
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const routes = ["/", "/spec", "/looper", "/looper/one-offs", "/looper/nightly-polish-run", "/looper/nightly-polish-run/spec", "/looper/nightly-polish-run/runs/48"];
for (const route of routes) {
  const response = await page.goto(base + route, { waitUntil: "networkidle" });
  check(`200 ${route}`, response?.status() === 200, String(response?.status()));
}

await page.goto(base + "/looper", { waitUntil: "networkidle" });
const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
check("font Inter", font.includes("Inter"), font);
check("background", bg === "rgb(7, 9, 12)", bg);

const panel = await page.evaluate(() => {
  const el = document.querySelector("[data-panel]");
  const style = getComputedStyle(el);
  return {
    background: style.backgroundColor,
    border: style.borderTopColor,
    blur: style.backdropFilter || style.webkitBackdropFilter,
  };
});
check("panel bg", panel.background === "rgba(17, 22, 29, 0.82)", panel.background);
check("panel border", panel.border === "rgb(34, 43, 54)", panel.border);
check("panel blur", String(panel.blur).includes("blur(6px)"), panel.blur);

check("sample label", (await page.locator('[data-testid="sample-label"]').first().innerText()).includes("Sample"));
check("header", (await page.locator('[data-testid="app-header"]').innerText()).includes("Looper"));
check("by DevRadar", (await page.locator('[data-testid="app-header"]').innerText()).includes("by DevRadar"));
check("avatar", await page.locator('[data-testid="avatar"]').count());
check("orbit", await page.locator('[data-testid="orbit-bg"] svg').count());
const motion = await animations(page);
check("dot count", motion.dotCount >= 4 && motion.dotCount <= 6, String(motion.dotCount));
check(
  "dot durations",
  motion.durations.every((list) => list.some((seconds) => seconds >= 60 && seconds <= 120)),
  JSON.stringify(motion.durations),
);

const tiles = await page.locator("[data-testid='summary-tiles'] [data-tile]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-tile")));
check("tiles", JSON.stringify(tiles) === JSON.stringify(["loops", "blocked", "needs-input", "avg-score", "runs-today", "cost-week"]), JSON.stringify(tiles));
const blockedBorder = await page.locator('[data-tile="blocked"]').evaluate((el) => getComputedStyle(el).borderTopColor);
check("blocked border", blockedBorder === "rgb(242, 104, 94)", blockedBorder);
const inputColor = await page.locator('[data-tile="needs-input"]').evaluate((el) => getComputedStyle(el).color);
check("input color", inputColor === "rgb(242, 180, 92)", inputColor);

const sections = await page.locator("[data-section]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-section")));
check("sections", JSON.stringify(sections) === JSON.stringify(["attention", "running", "paused"]), JSON.stringify(sections));
check("no oneoff section", await page.locator('[data-section="oneoffs"]').count() === 0);
check("no oneoff rows", await page.locator("[data-oneoff]").count() === 0);

const visibleCards = async () =>
  page.locator("[data-loop-card]").evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const style = getComputedStyle(node);
        return style.display !== "none" && style.visibility !== "hidden" && node.getClientRects().length > 0;
      })
      .map((node) => ({ id: node.getAttribute("data-loop-card"), status: node.getAttribute("data-status") })),
  );
const initial = await visibleCards();
const attention = initial.filter((card) => card.status === "blocked" || card.status === "input");
const running = initial.filter((card) => card.status === "running");
const paused = initial.filter((card) => card.status === "paused");
check("attention order", attention[0]?.status === "blocked" && attention.slice(1).every((card) => card.status === "input"), JSON.stringify(attention));
check("running visible", running.length <= 6 && running.length > 0, String(running.length));
check("paused hidden", paused.length === 0);
check("show more", (await page.locator('[data-testid="show-more"]').innerText()).includes("Show 6 more running"));
check("footer", (await page.locator("footer").innerText()).includes("Status from the routine snapshot, Sat Oct 31, 10:57 AM PT"));

const card = page.locator('[data-loop-card="nightly-polish-run"]');
check("nightly score", (await card.locator('[data-testid="card-score"]').innerText()).includes("84.9"));
check("spark path", await card.locator('[data-testid="card-sparkline"] path, [data-testid="card-sparkline"] polyline').count());
check("spark target", await card.locator("[data-target-line]").count());
check("since", (await card.locator('[data-testid="meta-runs"]').innerText()).includes("since"));
const nameSize = await card.locator('[data-testid="card-name"]').evaluate((el) => getComputedStyle(el).fontSize);
const nameWeight = await card.locator('[data-testid="card-name"]').evaluate((el) => getComputedStyle(el).fontWeight);
check("name size", nameSize === "18px", nameSize);
check("name weight", nameWeight === "700", nameWeight);
const scoreSize = await card.locator('[data-testid="card-score"]').evaluate((el) => getComputedStyle(el).fontSize);
const scoreWeight = await card.locator('[data-testid="card-score"]').evaluate((el) => getComputedStyle(el).fontWeight);
check("score size", scoreSize === "40px", scoreSize);
check("score weight", scoreWeight === "800" || scoreWeight === "700", scoreWeight);

await page.locator('[data-tile="blocked"]').click();
const onlyBlocked = await visibleCards();
check("blocked filter", onlyBlocked.length > 0 && onlyBlocked.every((cardItem) => cardItem.status === "blocked"), JSON.stringify(onlyBlocked));
await page.locator('[data-filter="all"]').click();

await card.locator('[data-testid="btn-spec"]').click();
const drawer = page.locator('[data-testid="drawer-spec"]');
await drawer.waitFor();
const drawerBox = await drawer.boundingBox();
check("drawer width", drawerBox && Math.round(drawerBox.width) === 640, String(drawerBox?.width));
check("drawer spec version", (await drawer.innerText()).includes("Version"));
check("drawer edited", (await drawer.innerText()).includes("edited"));
check("reconstructed", (await drawer.innerText()).includes("reconstructed from the routine"));
await page.keyboard.press("Escape");
await page.waitForTimeout(100);
check("drawer closed", await page.locator('[data-testid="drawer-spec"]').count() === 0);

const layout = await textIssues(page);
check("no small text 1440", layout.small.length === 0, JSON.stringify(layout.small.slice(0, 8)));
check("no dashes 1440", layout.dashes.length === 0, JSON.stringify(layout.dashes.slice(0, 4)));
check("no scroll 1440", layout.scrollWidth <= layout.clientWidth + 1, `${layout.scrollWidth} vs ${layout.clientWidth}`);

await page.goto(base + "/looper/nightly-polish-run", { waitUntil: "networkidle" });
check("breadcrumb", (await page.locator('[data-testid="breadcrumb"]').innerText()).includes("Loops"));
const titleSize = await page.locator('[data-testid="loop-title"]').evaluate((el) => getComputedStyle(el).fontSize);
const titleWeight = await page.locator('[data-testid="loop-title"]').evaluate((el) => getComputedStyle(el).fontWeight);
check("title 40", titleSize === "40px", titleSize);
check("title 800", titleWeight === "800", titleWeight);
const stats = await page.locator("[data-stat]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-stat")));
check("stats", JSON.stringify(stats) === JSON.stringify(["initiated", "runs", "success-rate", "avg-duration", "cost-per-run", "cost-to-date"]), JSON.stringify(stats));
check("composite", await page.locator('[data-series="composite"]').count());
check("extra series", await page.locator("[data-series]").count() > 1);
check("target line", await page.locator("[data-testid='score-chart'] [data-target-line]").count());
check("goal rows", await page.locator("[data-goal-row]").count());
check("progress", await page.locator("[data-goal-row] [data-progress]").count());
check("nothing blocking", (await page.locator("#blockers").innerText()).includes("Nothing is stopping this loop."));
const selected = await page.locator('[role="tab"][aria-selected="true"]').innerText();
check("progress tab", selected === "Progress log", selected);
const posts = await page.locator("[data-run-post]").evaluateAll((nodes) => nodes.map((node) => Number(node.getAttribute("data-run-post"))));
check("20 posts", posts.length <= 20 && posts.length > 0, String(posts.length));
check("newest first", posts[0] === 48 && posts.every((value, index) => index === 0 || posts[index - 1] > value), JSON.stringify(posts.slice(0, 5)));
const newest = page.locator('[data-run-post="48"]');
check("headline size", (await newest.locator('[data-testid="run-headline"]').evaluate((el) => getComputedStyle(el).fontSize)) === "20px");
check("headline weight", (await newest.locator('[data-testid="run-headline"]').evaluate((el) => getComputedStyle(el).fontWeight)) === "700");
check("changed link", await newest.locator('[data-testid="run-changed"] a[href]').count());
check("evals arrow", (await newest.locator('[data-testid="run-evals"]').innerText()).includes("→"));
check("suggested", await newest.locator('[data-testid="run-suggested"]').count());
check("permalink", (await newest.locator('[data-testid="run-permalink"]').getAttribute("href")) === "/looper/nightly-polish-run/runs/48");
await page.locator("#needs-input [data-testid='btn-approve']").first().click();
check("approved copy", (await page.locator("#needs-input").innerText()).includes("Approved · applies at the next sync (≤10 min)"));
check("edit button", await page.locator("#needs-input [data-testid='btn-edit']").count());
await page.locator('[data-testid="card-flag"][data-kind="input"]').click();
await page.waitForTimeout(200);
const needsBox = await page.locator("#needs-input").boundingBox();
const viewport = page.viewportSize();
check("scrolled to needs", needsBox && viewport && needsBox.y < viewport.height, String(needsBox?.y));

await page.goto(base + "/looper/nightly-polish-run/spec", { waitUntil: "networkidle" });
const specSections = await page.locator("[data-spec-section]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-spec-section")));
check("spec sections", ["purpose", "scope", "steps", "inputs", "runtime"].every((name) => specSections.includes(name)), JSON.stringify(specSections));
check("step chips", await page.locator("[data-step-chip]").count() >= 2);
const headers = await page.locator("[data-testid='goals-table'] th").allInnerTexts();
check("goal headers", headers.join("|") === "Goal|KPI|Now|Target|Last run", headers.join("|"));
const goalSections = await page.locator("[data-goals-section]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-goals-section")));
check("goal sections", ["evals", "guardrails", "qc"].every((name) => goalSections.includes(name)), JSON.stringify(goalSections));
const specText = await page.locator("main, .shell").innerText();
check("no raw md", !specText.includes("**") && !specText.includes("\n---") && !/(^|\s)#\w/.test(specText));

await page.goto(base + "/looper/one-offs", { waitUntil: "networkidle" });
check("oneoffs current", await page.locator('[data-testid="nav-oneoffs"]').getAttribute("aria-current") === "page");
const th = await page.locator("[data-testid='oneoffs-table'] th").allInnerTexts();
check("oneoff headers", th[0] === "Reminder" && th[1] === "Due" && th[2] === "Status", th.join("|"));
check("oneoff rows", await page.locator("[data-oneoff]").count() === 14);
check("no card score", await page.locator('[data-testid="card-score"]').count() === 0);

await page.goto(base + "/", { waitUntil: "networkidle" });
check("site header", (await page.locator('[data-testid="site-header"]').innerText()).includes("Looper"));
for (const name of ["dashboard", "loop", "specgoals"]) {
  const visual = page.locator(`[data-product-visual="${name}"]`);
  check(`visual ${name}`, await visual.locator('[data-testid="sample-label"]').count());
}
check("home sample", await page.locator('[data-testid="sample-label"]').count() >= 4);

await page.goto(base + "/spec", { waitUntil: "networkidle" });
check("spec headings", (await page.locator("h2, h3").count()) >= 3);

for (const width of [375, 768, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  for (const route of ["/looper", "/looper/nightly-polish-run", "/looper/nightly-polish-run/spec", "/looper/one-offs", "/", "/spec"]) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    const issues = await textIssues(page);
    check(`scroll ${width} ${route}`, issues.scrollWidth <= issues.clientWidth + 1, `${issues.scrollWidth} vs ${issues.clientWidth}`);
    check(`type ${width} ${route}`, issues.small.length === 0, JSON.stringify(issues.small.slice(0, 6)));
    check(`dash ${width} ${route}`, issues.dashes.length === 0, JSON.stringify(issues.dashes.slice(0, 3)));
  }
}

await page.setViewportSize({ width: 1440, height: 900 });
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(base + "/looper", { waitUntil: "networkidle" });
const reduced = await animations(page);
check("reduced motion", reduced.running === 0, String(reduced.running));

await browser.close();
if (failures.length) {
  console.log(`FAILED ${failures.length}`);
  for (const failure of failures) console.log(`- ${failure}`);
  process.exit(1);
}
console.log("All contract checks passed");
