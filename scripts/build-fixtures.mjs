import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const fixturesDir = path.join(root, "fixtures");
const runsDir = path.join(fixturesDir, "runs");

function round1(value) {
  return Math.round(value * 10) / 10;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function trend(end, delta, count = 14) {
  const start = end - delta;
  const values = [];
  for (let index = 0; index < count; index += 1) {
    const t = count === 1 ? 1 : index / (count - 1);
    const wobble = index === count - 1 ? 0 : Math.sin(index * 1.3) * 0.35;
    values.push(round1(start + (end - start) * t + wobble));
  }
  values[count - 1] = end;
  return values;
}

function bounds(values, target, forced) {
  if (forced) return forced;
  const nums = values.filter((value) => Number.isFinite(value));
  if (target != null) nums.push(target);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const pad = Math.max(2, (max - min) * 0.2);
  return { yMin: Math.floor(min - pad), yMax: Math.ceil(max + pad) };
}

function chartOf(composite, extra, target, ticks, forced) {
  const series = extra ? [extra] : [];
  const box = bounds([...composite, ...(extra?.values ?? [])], target, forced);
  return {
    tickLabels: ticks,
    composite,
    series,
    target,
    yMin: box.yMin,
    yMax: box.yMax,
  };
}

const defaultTicks = [
  { index: 0, text: "Oct 17" },
  { index: 7, text: "Oct 24" },
  { index: 13, text: "Oct 30" },
];

function simpleSpec(name, schedule) {
  return {
    version: "1",
    editedLabel: "Oct 10",
    reconstructed: false,
    purpose: `${name} keeps a recurring check on its area and writes down the result of each run.`,
    scope: {
      products: "Docs, the marketing site",
      allowed: "Copy, layout, links, small fixes",
      notAllowed: "Pricing, auth, data deletion, posting publicly",
    },
    steps: ["Read the latest inputs", "Draft a small change", "Run checks", "Write the log post"],
    inputs: ["The loop prompt", "The repo for this area"],
    runtime: {
      schedule,
      timeLimit: "30 min",
      budget: "$1 per run",
      model: "a fast model",
    },
  };
}

function simpleGoals(score, target, tone) {
  const lastRun = tone === "down" ? "-0.6" : tone === "flat" ? "no change" : "+0.4";
  const progress = Math.max(0, Math.min(100, (score / target) * 100));
  return {
    goalRows: [
      {
        goal: "Reach the target",
        kpi: "Composite score",
        now: String(score),
        target: String(target),
        lastRun,
        tone,
      },
    ],
    progressRows: [
      {
        label: "Composite score",
        valueLabel: String(score),
        goalLabel: `goal ${target}`,
        progress,
        color: "#5CD68C",
      },
    ],
  };
}

function emptyChart() {
  return {
    tickLabels: [],
    composite: [],
    series: [{ key: "quality", label: "Quality", color: "#5CD68C", values: [] }],
    target: null,
    yMin: 0,
    yMax: 100,
  };
}

function baseLoop(fields) {
  return {
    suggestions: [],
    blockers: [],
    goalNotes: [],
    flags: [],
    evals: ["Layout check at 375, 768 and 1440px", "Confirm the run log matches the diff"],
    guardrails: ["Stop and flag if 2 runs in a row fail", "Stay inside the budget for the run"],
    qc: ["The owner approves anything flagged needs input."],
    ...fields,
  };
}

const nightlySpec = {
  version: "4",
  editedLabel: "Oct 22",
  reconstructed: true,
  purpose:
    "Every night, ship 2 to 3 small, safe improvements per product across the docs and the marketing site, each verified, so quality rises steadily without big risky changes.",
  scope: {
    products: "Explorer, Insights, Forecast, Docs, the marketing site",
    allowed: "Copy, layout, links, small fixes",
    notAllowed: "Pricing, auth, data deletion, posting publicly",
  },
  steps: [
    "Read quality report",
    "Pick lowest pages",
    "Draft 2 to 3 fixes",
    "Run checks",
    "Merge or revert",
    "Write log post",
  ],
  inputs: [
    "Morning quality report (scores per page)",
    "Git repos for each product, preview builds",
    "Fact check for changed claims",
  ],
  runtime: {
    schedule: "Daily ~11:00 PM PT",
    timeLimit: "45 min",
    budget: "$3 per run, $80 per month",
    model: "a fast model; a larger model for review",
  },
};

const nightlyGoals = {
  goalRows: [
    { goal: "Better pages", kpi: "Portfolio quality score", now: "84.9", target: "90", lastRun: "+0.6", tone: "up" },
    { goal: "Clearer writing", kpi: "Copy score", now: "68.0", target: "80", lastRun: "+0.8", tone: "up" },
    { goal: "Accurate claims", kpi: "Fact score (provisional)", now: "83.0", target: "90", lastRun: "no change", tone: "flat" },
    { goal: "Steady pace", kpi: "Changes per product per night", now: "2.6", target: "2-3", lastRun: "met", tone: "met" },
  ],
  progressRows: [
    { label: "Portfolio quality", valueLabel: "84.9", goalLabel: "goal 90", progress: 94, color: "#5CD68C" },
    { label: "Copy score", valueLabel: "68.0", goalLabel: "goal 80", progress: 85, color: "#A78BFA" },
    { label: "Fact score", valueLabel: "83.0", goalLabel: "goal 90, provisional", progress: 92, color: "#5CC8C8" },
    { label: "Changes shipped per product, per night", valueLabel: "2.6", goalLabel: "goal 2-3", progress: 100, color: "#5CD68C" },
    { label: "Changes reverted", valueLabel: "1 of 124", goalLabel: "goal under 5%", progress: 16, color: "#F2B45C" },
  ],
  goalNotes: ["Fact score is provisional: 1,471 claims still pending."],
};

function scoredLoop(input) {
  const tone = input.delta14d < 0 ? "down" : input.delta14d === 0 ? "flat" : "up";
  const sparkline = trend(input.score, input.delta14d);
  const extra = {
    key: "quality",
    label: "Quality",
    color: "#8C97A4",
    values: trend(Math.max(0, input.score - 4), Math.max(0.4, input.delta14d / 2)),
  };
  extra.values[extra.values.length - 1] = round1(Math.max(0, input.score - 4));
  const goals = simpleGoals(input.score, input.target, tone);
  return baseLoop({
    scoreState: "scored",
    status: input.status ?? "running",
    timezone: "America/Los_Angeles",
    scheduleCron: input.scheduleCron ?? "0 9 * * *",
    delta14dLabel: input.delta14d === 0 ? "steady" : `${input.delta14d > 0 ? "+" : ""}${input.delta14d.toFixed(1)} in 14 days`,
    deltaSinceStartLabel: `${input.delta14d >= 0 ? "+" : ""}${(input.delta14d >= 0 ? input.delta14d + 1 : input.delta14d - 1).toFixed(1)} since start`,
    sparkline,
    chart: chartOf(sparkline, extra, input.target, defaultTicks),
    spec: simpleSpec(input.name, input.scheduleWords),
    ...goals,
    ...input,
    delta14dLabel: input.delta14d === 0 ? "steady" : `${input.delta14d > 0 ? "+" : ""}${input.delta14d.toFixed(1)} in 14 days`,
  });
}

const loops = [
  baseLoop({
    id: "partner-invite-acceptances",
    name: "Partner invite acceptances",
    status: "blocked",
    scoreState: "no-goals",
    initiatedLabel: "Sep 14, 2026",
    scheduleWords: "Weekdays ~10:00 AM",
    scheduleCron: "0 10 * * 1-5",
    timezone: "America/Los_Angeles",
    nextRunLabel: "Mon Nov 2, 10:00 AM",
    score: null,
    target: null,
    delta14d: null,
    delta14dLabel: "no data",
    deltaSinceStartLabel: "no data",
    kpiChips: [],
    runsMeta: "34 · since Sep 14",
    costMeta: "~$0.06/run · 2 min",
    flags: [
      { kind: "blocker", text: "⚑ Blocked · 2 warnings" },
      { kind: "input", text: "Needs input · 1" },
    ],
    suggestions: [
      {
        id: "invite-note",
        title: "Confirm the invite note",
        detail: "The last draft of the invite note is 2 weeks old. Approve it or edit the wording before the next batch.",
        canEdit: true,
      },
    ],
    stats: {
      initiated: "Sep 14, 2026",
      runs: "34",
      successRate: "no data",
      avgDuration: "2 min",
      costPerRun: "~$0.06",
      costToDate: "no data",
    },
    sparkline: [],
    chart: emptyChart(),
    blockers: [
      {
        title: "Account session expired",
        detail: "The loop could not accept invites because the account login expired.",
        runN: 34,
        when: "Oct 30, 2026",
        fix: "Reconnect account",
      },
      {
        title: "Invite list is missing a column",
        detail: "The source sheet no longer has the email column the loop expects.",
        runN: 33,
        when: "Oct 29, 2026",
        fix: "Retry",
      },
    ],
    spec: simpleSpec("Partner invite acceptances", "Weekdays ~10:00 AM"),
    goalRows: [],
    progressRows: [],
    listRank: 0,
  }),
  baseLoop({
    id: "nightly-polish-run",
    name: "Nightly polish run (docs and marketing site)",
    status: "running",
    scoreState: "scored",
    initiatedLabel: "Sep 13, 2026",
    scheduleWords: "Daily ~11:00 PM",
    scheduleCron: "0 23 * * *",
    timezone: "America/Los_Angeles",
    nextRunLabel: "Tonight, 11:00 PM",
    score: 84.9,
    target: 90,
    delta14d: 3.1,
    delta14dLabel: "+3.1 in 14 days",
    deltaSinceStartLabel: "+6.9 since start",
    kpiChips: [
      { label: "Quality", value: "84.9" },
      { label: "Copy", value: "68.0" },
      { label: "Facts", value: "83.0+" },
    ],
    runsMeta: "48 · since Sep 13",
    costMeta: "~$1.40/run · 22 min",
    flags: [{ kind: "input", text: "Needs input · 3 suggestions" }],
    suggestions: [
      {
        id: "copy-weight",
        title: "Raise the copy-score goal's weight",
        detail: "Copy is lagging (68 vs 80). Suggest spending 1 of the nightly changes on it until it reaches 75.",
        canEdit: true,
      },
      {
        id: "fact-backlog",
        title: "Clear the fact-check backlog",
        detail: "1,471 claims pending. Suggest a one-time batch run (~$18).",
        canEdit: false,
      },
      {
        id: "nav-labels",
        title: "Tighten the docs nav labels",
        detail: "Three section names are longer than the header can hold at 375px. Suggest shorter labels on the next run.",
        canEdit: false,
      },
    ],
    stats: {
      initiated: "Sep 13, 2026",
      runs: "48",
      successRate: "96%",
      avgDuration: "22 min",
      costPerRun: "~$1.40",
      costToDate: "$67.20",
    },
    sparkline: [],
    chart: emptyChart(),
    blockers: [],
    spec: nightlySpec,
    ...nightlyGoals,
    evals: [
      "Layout check at 375, 768 and 1440px",
      "Link check, no new 404s",
      "Design sync rules (header, tokens, type sizes)",
      "Fact check on any changed claim",
    ],
    guardrails: [
      "Auto-revert any change that fails an eval",
      "Stop and flag if 2 runs in a row fail",
      "Never change pricing, auth or public posting",
      "Cost cap $3 per run; stop when reached",
    ],
    qc: ['A second model reviews every diff before merge. The owner approves anything flagged "needs input".'],
    listRank: 1,
  }),
  baseLoop({
    id: "weekly-review",
    name: "Weekly review",
    status: "running",
    scoreState: "no-goals",
    initiatedLabel: "Sep 13, 2026",
    scheduleWords: "Sundays 6:00 PM",
    scheduleCron: "0 18 * * 0",
    timezone: "America/Los_Angeles",
    nextRunLabel: "Sun Nov 1, 6:00 PM",
    score: null,
    target: null,
    delta14d: null,
    delta14dLabel: "no data",
    deltaSinceStartLabel: "no data",
    kpiChips: [],
    runsMeta: "7 · since Sep 13",
    costMeta: "~$0.30/run · 5 min",
    flags: [{ kind: "input", text: "Needs input · define goals" }],
    suggestions: [
      {
        id: "define-goals",
        title: "Define goals and KPIs",
        detail: "This loop has no goals yet, so it cannot earn a score. Add a target for each result you want to track.",
        canEdit: true,
      },
    ],
    stats: {
      initiated: "Sep 13, 2026",
      runs: "7",
      successRate: "no data",
      avgDuration: "5 min",
      costPerRun: "~$0.30",
      costToDate: "no data",
    },
    sparkline: [],
    chart: emptyChart(),
    blockers: [],
    spec: simpleSpec("Weekly review", "Sundays 6:00 PM"),
    goalRows: [],
    progressRows: [],
    listRank: 2,
  }),
  scoredLoop({
    id: "morning-quality-report",
    name: "Morning quality report",
    listRank: 10,
    score: 84.9,
    target: 90,
    delta14d: 3.1,
    initiatedLabel: "Sep 12, 2026",
    scheduleWords: "Daily ~7:00 AM",
    scheduleCron: "0 7 * * *",
    nextRunLabel: "Sun Nov 1, 7:00 AM",
    kpiChips: [
      { label: "Pages scored", value: "62" },
      { label: "Lowest page", value: "61" },
    ],
    runsMeta: "49 · since Sep 12",
    costMeta: "~$0.40/run · 6 min",
    stats: {
      initiated: "Sep 12, 2026",
      runs: "49",
      successRate: "no data",
      avgDuration: "6 min",
      costPerRun: "~$0.40",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "event-scan",
    name: "Local events scan",
    listRank: 11,
    score: 78,
    target: 85,
    delta14d: 5,
    initiatedLabel: "Sep 12, 2026",
    scheduleWords: "Daily, 7:39 AM, 1:39 PM",
    scheduleCron: "39 7,13 * * *",
    nextRunLabel: "Today, 1:39 PM",
    kpiChips: [
      { label: "Companies", value: "201" },
      { label: "People", value: "227" },
      { label: "Events", value: "46" },
    ],
    runsMeta: "86 · since Sep 12",
    costMeta: "~$0.25/run · 4 min",
    stats: {
      initiated: "Sep 12, 2026",
      runs: "86",
      successRate: "no data",
      avgDuration: "4 min",
      costPerRun: "~$0.25",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "reply-filter",
    name: "Reply credibility filter",
    listRank: 12,
    score: 91,
    target: 90,
    delta14d: 4.1,
    initiatedLabel: "Sep 20, 2026",
    scheduleWords: "Every 15 min, 8:05 AM to 10:57 PM",
    scheduleCron: "5,20,35,50 8-22 * * *",
    nextRunLabel: "Today, 11:05 AM",
    kpiChips: [
      { label: "Posts graded", value: "449" },
      { label: "Failed in a row", value: "0" },
    ],
    runsMeta: "1,012 · since Sep 20",
    costMeta: "~$0.01/run · 20 s",
    stats: {
      initiated: "Sep 20, 2026",
      runs: "1,012",
      successRate: "no data",
      avgDuration: "20 s",
      costPerRun: "~$0.01",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "job-digests",
    name: "Morning job digests",
    listRank: 13,
    score: 72,
    target: 80,
    delta14d: 4.2,
    initiatedLabel: "Sep 15, 2026",
    scheduleWords: "Weekdays 8:01 AM",
    scheduleCron: "1 8 * * 1-5",
    nextRunLabel: "Mon Nov 2, 8:01 AM",
    kpiChips: [
      { label: "Roles tracked", value: "350" },
      { label: "New this week", value: "18" },
    ],
    runsMeta: "35 · since Sep 15",
    costMeta: "~$0.20/run · 7 min",
    stats: {
      initiated: "Sep 15, 2026",
      runs: "35",
      successRate: "no data",
      avgDuration: "7 min",
      costPerRun: "~$0.20",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "api-self-eval",
    name: "API nightly self-eval",
    listRank: 14,
    score: 66,
    target: 85,
    delta14d: -3.5,
    initiatedLabel: "Oct 19, 2026",
    scheduleWords: "Daily ~11:30 PM",
    scheduleCron: "30 23 * * *",
    nextRunLabel: "Tonight, 11:30 PM",
    kpiChips: [
      { label: "Eval pass rate", value: "88%" },
      { label: "Regressions", value: "0" },
    ],
    runsMeta: "12 · since Oct 19",
    costMeta: "~$0.90/run · 14 min",
    stats: {
      initiated: "Oct 19, 2026",
      runs: "12",
      successRate: "no data",
      avgDuration: "14 min",
      costPerRun: "~$0.90",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "site-edit-sync",
    name: "Site edit sync",
    listRank: 15,
    score: 99,
    target: 98,
    delta14d: 0,
    initiatedLabel: "Sep 10, 2026",
    scheduleWords: "Every 10 min, 7:07 AM to 10:57 PM",
    scheduleCron: "7,17,27,37,47,57 7-22 * * *",
    nextRunLabel: "Today, 11:07 AM",
    kpiChips: [
      { label: "Edits applied", value: "312" },
      { label: "Conflicts", value: "0" },
    ],
    runsMeta: "4,410 · since Sep 10",
    costMeta: "~$0.002/run · 8 s",
    stats: {
      initiated: "Sep 10, 2026",
      runs: "4,410",
      successRate: "no data",
      avgDuration: "8 s",
      costPerRun: "~$0.002",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "changelog-digest",
    name: "Changelog digest",
    listRank: 16,
    score: 86,
    target: 90,
    delta14d: 4,
    initiatedLabel: "Sep 22, 2026",
    scheduleWords: "Weekdays 9:00 AM",
    nextRunLabel: "Mon Nov 2, 9:00 AM",
    kpiChips: [
      { label: "Notes shipped", value: "24" },
      { label: "Repos", value: "6" },
    ],
    runsMeta: "28 · since Sep 22",
    costMeta: "~$0.15/run · 4 min",
    stats: {
      initiated: "Sep 22, 2026",
      runs: "28",
      successRate: "no data",
      avgDuration: "4 min",
      costPerRun: "~$0.15",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "broken-link-sweep",
    name: "Broken link sweep",
    listRank: 17,
    score: 88,
    target: 95,
    delta14d: 5,
    initiatedLabel: "Sep 20, 2026",
    scheduleWords: "Daily ~6:30 AM",
    nextRunLabel: "Sun Nov 1, 6:30 AM",
    kpiChips: [
      { label: "Links checked", value: "1,204" },
      { label: "Broken", value: "3" },
    ],
    runsMeta: "40 · since Sep 20",
    costMeta: "~$0.08/run · 3 min",
    stats: {
      initiated: "Sep 20, 2026",
      runs: "40",
      successRate: "no data",
      avgDuration: "3 min",
      costPerRun: "~$0.08",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "weekly-metrics-email",
    name: "Weekly metrics email",
    listRank: 18,
    score: 80,
    target: 85,
    delta14d: 3,
    initiatedLabel: "Sep 8, 2026",
    scheduleWords: "Mondays 8:30 AM",
    nextRunLabel: "Mon Nov 2, 8:30 AM",
    kpiChips: [
      { label: "Reports sent", value: "12" },
      { label: "Opens", value: "64%" },
    ],
    runsMeta: "8 · since Sep 8",
    costMeta: "~$0.12/run · 3 min",
    stats: {
      initiated: "Sep 8, 2026",
      runs: "8",
      successRate: "no data",
      avgDuration: "3 min",
      costPerRun: "~$0.12",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "support-inbox-triage",
    name: "Support inbox triage",
    listRank: 19,
    score: 75,
    target: 80,
    delta14d: 2,
    initiatedLabel: "Sep 18, 2026",
    scheduleWords: "Hourly, 9:00 AM to 6:00 PM",
    nextRunLabel: "Today, 11:00 AM",
    kpiChips: [
      { label: "Threads", value: "86" },
      { label: "Waiting", value: "4" },
    ],
    runsMeta: "220 · since Sep 18",
    costMeta: "~$0.04/run · 1 min",
    stats: {
      initiated: "Sep 18, 2026",
      runs: "220",
      successRate: "no data",
      avgDuration: "1 min",
      costPerRun: "~$0.04",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "dependency-update-check",
    name: "Dependency update check",
    listRank: 20,
    score: 82,
    target: 90,
    delta14d: 6,
    initiatedLabel: "Sep 16, 2026",
    scheduleWords: "Weekdays 7:30 AM",
    nextRunLabel: "Mon Nov 2, 7:30 AM",
    kpiChips: [
      { label: "Packages", value: "140" },
      { label: "Updates", value: "9" },
    ],
    runsMeta: "30 · since Sep 16",
    costMeta: "~$0.18/run · 5 min",
    stats: {
      initiated: "Sep 16, 2026",
      runs: "30",
      successRate: "no data",
      avgDuration: "5 min",
      costPerRun: "~$0.18",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "docs-freshness-check",
    name: "Docs freshness check",
    listRank: 21,
    score: 90,
    target: 90,
    delta14d: 4,
    initiatedLabel: "Sep 19, 2026",
    scheduleWords: "Daily ~5:00 AM",
    nextRunLabel: "Sun Nov 1, 5:00 AM",
    kpiChips: [
      { label: "Pages", value: "220" },
      { label: "Stale", value: "2" },
    ],
    runsMeta: "42 · since Sep 19",
    costMeta: "~$0.10/run · 4 min",
    stats: {
      initiated: "Sep 19, 2026",
      runs: "42",
      successRate: "no data",
      avgDuration: "4 min",
      costPerRun: "~$0.10",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "social-post-scheduler",
    name: "Social post scheduler",
    status: "paused",
    listRank: 30,
    score: 70,
    target: 80,
    delta14d: 3,
    initiatedLabel: "Aug 2, 2026",
    scheduleWords: "Paused",
    nextRunLabel: "Not scheduled",
    kpiChips: [
      { label: "Drafts", value: "8" },
      { label: "Scheduled", value: "0" },
    ],
    runsMeta: "11 · since Aug 2",
    costMeta: "~$0.05/run · 2 min",
    stats: {
      initiated: "Aug 2, 2026",
      runs: "11",
      successRate: "no data",
      avgDuration: "2 min",
      costPerRun: "~$0.05",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "newsletter-draft",
    name: "Newsletter draft",
    status: "paused",
    listRank: 31,
    score: 77,
    target: 85,
    delta14d: 4,
    initiatedLabel: "Aug 15, 2026",
    scheduleWords: "Fridays 4:00 PM",
    nextRunLabel: "Not scheduled",
    kpiChips: [
      { label: "Issues", value: "6" },
      { label: "Open rate", value: "41%" },
    ],
    runsMeta: "6 · since Aug 15",
    costMeta: "~$0.22/run · 8 min",
    stats: {
      initiated: "Aug 15, 2026",
      runs: "6",
      successRate: "no data",
      avgDuration: "8 min",
      costPerRun: "~$0.22",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "pricing-page-test",
    name: "Pricing page test",
    status: "paused",
    listRank: 32,
    score: 83,
    target: 88,
    delta14d: 3.4,
    initiatedLabel: "Sep 1, 2026",
    scheduleWords: "Paused",
    nextRunLabel: "Not scheduled",
    kpiChips: [
      { label: "Variants", value: "3" },
      { label: "Winner", value: "none" },
    ],
    runsMeta: "9 · since Sep 1",
    costMeta: "~$0.30/run · 6 min",
    stats: {
      initiated: "Sep 1, 2026",
      runs: "9",
      successRate: "no data",
      avgDuration: "6 min",
      costPerRun: "~$0.30",
      costToDate: "no data",
    },
  }),
  scoredLoop({
    id: "partner-follow-ups",
    name: "Partner follow-ups",
    status: "paused",
    listRank: 33,
    score: 80.4,
    target: 85,
    delta14d: 4,
    initiatedLabel: "Aug 20, 2026",
    scheduleWords: "Paused",
    nextRunLabel: "Not scheduled",
    kpiChips: [
      { label: "Threads", value: "14" },
      { label: "Replies", value: "5" },
    ],
    runsMeta: "15 · since Aug 20",
    costMeta: "~$0.07/run · 2 min",
    stats: {
      initiated: "Aug 20, 2026",
      runs: "15",
      successRate: "no data",
      avgDuration: "2 min",
      costPerRun: "~$0.07",
      costToDate: "no data",
    },
  }),
];

function nightlySeries() {
  const composite = [];
  const copy = [];
  const facts = [];
  for (let index = 0; index < 48; index += 1) {
    const t = index / 47;
    composite.push(round1(Math.min(88, Math.max(76, 78 + 6.9 * t + Math.sin(index * 0.65) * 0.45))));
    copy.push(round1(Math.min(70, Math.max(60, 61 + 7 * t + Math.sin(index * 0.5) * 0.4))));
    facts.push(round1(Math.min(85, Math.max(78, 79.4 + 3.6 * t + Math.sin(index * 0.4) * 0.25))));
  }
  composite[0] = 78;
  composite[33] = 81.8;
  composite[45] = 84.5;
  composite[46] = 84.3;
  composite[47] = 84.9;
  copy[0] = 61;
  copy[46] = 67.2;
  copy[47] = 68;
  facts[0] = 79.4;
  facts[46] = 83;
  facts[47] = 83;
  return { composite, copy, facts };
}

const headlines = [
  "Smoothed a heading on the Docs page",
  "Repointed a stale link in the writing index",
  "Shortened a button label on Explorer",
  "Aligned the Insights hero with the type scale",
  "Fixed a wrapping label on Forecast",
  "Tightened spacing under the docs nav",
  "Corrected a claim on the marketing site",
  "Dropped an unused style from the docs layout",
  "Clarified an empty state on Explorer",
  "Refreshed the footer links on the marketing site",
];

function nightlyRuns() {
  const { composite, copy, facts } = nightlySeries();
  const start = Date.parse("2026-09-14T06:00:00.000Z");
  const runs = [];
  for (let index = 0; index < 48; index += 1) {
    const n = index + 1;
    let duration = 1320;
    let cost = 1.4;
    let status = "ok";
    if (n === 20) status = "failed";
    if (n === 45) cost = 1.36;
    if (n === 46) duration = 1260;
    if (n === 47) {
      duration = 1440;
      cost = 1.46;
      status = "reverted";
    }
    if (n === 48) {
      duration = 1260;
      cost = 1.38;
    }
    const extraMin = n === 48 ? 2 : n === 47 ? 1 : 0;
    const started = new Date(start + index * 86400000 + extraMin * 60000).toISOString();
    const score = composite[index];
    const prev = index === 0 ? null : composite[index - 1];
    const headline =
      n === 48
        ? "Tightened the Explorer result card and fixed two broken links"
        : n === 47
          ? "One change reverted after a failed check"
          : n === 20
            ? "Run stopped after a failed check"
            : headlines[(n - 1) % headlines.length];
    const summary =
      n === 48
        ? "Shipped three small changes across the docs and the marketing site. The Explorer card now shows one headline number, the forecast page label was corrected, and two dead links on the writing index were repointed. All three passed their checks before merge."
        : n === 47
          ? "A header spacing change on the Docs page failed the layout check at 375px and was reverted automatically. Two other changes shipped. The loop logged the failure and lowered its confidence in layout edits for tomorrow."
          : `Run ${n} shipped a small, checked change on the docs or the marketing site. The loop recorded the quality score, the copy score, and the fact score for this night.`;
    const changed =
      n === 48
        ? [
            { text: "Explorer: one headline number, PR 212", url: "/looper/nightly-polish-run/runs/48" },
            { text: "Forecast: rating tiers, PR 87", url: "/looper/nightly-polish-run/runs/48" },
            { text: "the marketing site: 2 links, commit 4e1a", url: "/looper/nightly-polish-run/runs/48" },
          ]
        : [{ text: "Logged the nightly notes", url: `/looper/nightly-polish-run/runs/${n}` }];
    const evals =
      n === 48
        ? [
            { text: "Quality 84.3 → 84.9" },
            { text: "Copy 67.2 → 68.0" },
            { text: "Facts 83.0 (no change)" },
          ]
        : n === 47
          ? [
              { text: "Quality 84.5 → 84.3" },
              { text: "Copy 67.0 → 67.2" },
              { text: "Facts 83.0 → 83.0" },
            ]
          : [{ text: `Quality ${prev ?? 78} → ${score}` }];
    const suggested =
      n === 48
        ? ["Wants approval to rewrite the Insights hero copy (needs input)", "Suggests a batch fact-check run"]
        : ["No approval is waiting on this run."];
    runs.push({
      loop_id: "nightly-polish-run",
      n,
      started_at: started,
      duration_s: duration,
      cost_usd: cost,
      status,
      kpis: { quality: score, copy: copy[index], facts: facts[index] },
      score,
      score_delta: prev == null ? null : round1(score - prev),
      post: { headline, summary, changed, evals, suggested },
    });
  }
  const costSum = round2(runs.reduce((sum, run) => sum + run.cost_usd, 0));
  const durationAvg = runs.reduce((sum, run) => sum + run.duration_s, 0) / runs.length;
  const okCount = runs.filter((run) => run.status === "ok").length;
  if (costSum !== 67.2) throw new Error(`nightly cost ${costSum}`);
  if (durationAvg !== 1320) throw new Error(`nightly duration ${durationAvg}`);
  if (okCount !== 46) throw new Error(`nightly ok ${okCount}`);
  if (runs[47].score !== 84.9 || runs[46].score !== 84.3) throw new Error("nightly ending scores");
  if (round1(runs[47].score - composite[0]) !== 6.9) throw new Error("since start");
  return { runs, composite, copy, facts };
}

function genericRuns(loop) {
  const total = Number(String(loop.stats.runs).replace(/,/g, ""));
  const store = Math.min(total, loop.id === "api-self-eval" || loop.id === "weekly-review" ? total : 16);
  const startN = total - store + 1;
  const anchor = Date.parse("2026-10-31T06:00:00.000Z");
  const runs = [];
  for (let n = startN; n <= total; n += 1) {
    const score = loop.score == null ? null : loop.sparkline[Math.min(loop.sparkline.length - 1, n - startN)] ?? loop.score;
    const prev = runs.length ? runs[runs.length - 1].score : null;
    const status = loop.id === "partner-invite-acceptances" && n === total ? "failed" : "ok";
    const started = new Date(anchor - (total - n) * 86400000).toISOString();
    runs.push({
      loop_id: loop.id,
      n,
      started_at: started,
      duration_s: 300,
      cost_usd: 0.2,
      status,
      kpis: loop.score == null ? {} : { quality: score },
      score,
      score_delta: prev == null || score == null ? null : round1(score - prev),
      post: {
        headline: n === total ? `Latest sample post for ${loop.name}` : `Sample note for run ${n}`,
        summary: `This sample post records run ${n} for ${loop.name}. The text is generic and the figures shown on the card are the sample values for this loop.`,
        changed: [{ text: "Updated the working notes", url: `/looper/${loop.id}/runs/${n}` }],
        evals: [{ text: loop.score == null ? "Checks → no score yet" : `Quality ${prev ?? score} → ${score}` }],
        suggested: ["No approval is waiting on this run."],
      },
    });
  }
  return runs;
}

const { runs: nightly, composite, copy, facts } = nightlyRuns();
const nightlyLoop = loops.find((loop) => loop.id === "nightly-polish-run");
nightlyLoop.sparkline = composite.slice(-14);
nightlyLoop.chart = {
  tickLabels: [
    { index: 0, text: "Sep 13" },
    { index: 16, text: "Sep 29" },
    { index: 32, text: "Oct 15" },
    { index: 47, text: "Oct 30" },
  ],
  composite,
  series: [
    { key: "copy", label: "Copy", color: "#A78BFA", values: copy },
    { key: "facts", label: "Facts", color: "#5CC8C8", values: facts },
  ],
  target: 90,
  yMin: 60,
  yMax: 90,
  pointHrefs: nightly.map((run) => `/looper/nightly-polish-run/runs/${run.n}`),
};

const scored = loops.filter((loop) => loop.score != null);
const scoreSum = round1(scored.reduce((sum, loop) => sum + loop.score, 0) * 10) / 10;
const deltaSum = round1(scored.reduce((sum, loop) => sum + loop.delta14d, 0) * 10) / 10;
const avgScore = round1(scored.reduce((sum, loop) => sum + loop.score, 0) / scored.length);
const avgDelta = round1(scored.reduce((sum, loop) => sum + loop.delta14d, 0) / scored.length);
if (loops.length !== 19) throw new Error(`loop count ${loops.length}`);
if (scored.length !== 17) throw new Error(`scored ${scored.length}`);
if (avgScore !== 81.6) throw new Error(`avg score ${avgScore} sum ${scoreSum}`);
if (avgDelta !== 3.2) throw new Error(`avg delta ${avgDelta} sum ${deltaSum}`);

const oneOffs = [
  ["renew-domain", "Renew domain", "Nov 12, 2026", "Open"],
  ["book-venue", "Book venue for meetup", "Nov 8, 2026", "Open"],
  ["cooler-ice", "Cooler and ice check", "Nov 8, 2026", "Open"],
  ["rotate-tokens", "Rotate API tokens", "Nov 3, 2026", "Open"],
  ["export-metrics", "Export monthly metrics", "Nov 2, 2026", "Due soon"],
  ["review-paused", "Review paused loops", "Nov 5, 2026", "Open"],
  ["oncall-roster", "Update the on-call roster", "Nov 15, 2026", "Open"],
  ["backup-restore", "Check backup restore", "Nov 6, 2026", "Open"],
  ["speaker-confirmations", "Send speaker confirmations", "Nov 9, 2026", "Waiting"],
  ["name-badges", "Order name badges", "Nov 7, 2026", "Open"],
  ["expense-receipts", "File expense receipts", "Nov 4, 2026", "Due soon"],
  ["error-tracker", "Renew the error tracker", "Dec 1, 2026", "Open"],
  ["retro", "Schedule the retro", "Nov 10, 2026", "Open"],
  ["catering-count", "Confirm catering count", "Nov 8, 2026", "Open"],
].map(([id, reminder, due, status]) => ({ id, reminder, due, status }));

const summary = {
  snapshotLabel: "Sat Oct 31, 10:57 AM PT",
  runsToday: 63,
  costWeek: 42.1,
};

fs.mkdirSync(runsDir, { recursive: true });
for (const file of fs.readdirSync(runsDir)) fs.unlinkSync(path.join(runsDir, file));
fs.writeFileSync(path.join(fixturesDir, "loops.json"), `${JSON.stringify(loops, null, 2)}\n`);
fs.writeFileSync(path.join(fixturesDir, "one-offs.json"), `${JSON.stringify(oneOffs, null, 2)}\n`);
fs.writeFileSync(path.join(fixturesDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(path.join(runsDir, "nightly-polish-run.json"), `${JSON.stringify(nightly, null, 2)}\n`);
for (const loop of loops) {
  if (loop.id === "nightly-polish-run") continue;
  fs.writeFileSync(path.join(runsDir, `${loop.id}.json`), `${JSON.stringify(genericRuns(loop), null, 2)}\n`);
}

const banned = ["\u2014", "\u2013", "Founders Bay", "LinkedIn", "Verafy", "rexstjohn", "Claude", "Sonnet", "Opus", "Swarm", "Seattle"];
const blob = fs.readdirSync(fixturesDir, { recursive: true }).map((file) => {
  const full = path.join(fixturesDir, file);
  return fs.statSync(full).isFile() ? fs.readFileSync(full, "utf8") : "";
}).join("\n");
for (const word of banned) {
  if (blob.includes(word)) throw new Error(`banned token ${word}`);
}

console.log(`Wrote ${loops.length} loops, ${oneOffs.length} one-offs, nightly runs ${nightly.length}`);
