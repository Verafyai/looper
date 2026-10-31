import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { blockedReason, type BlockReason } from "./blocked";
import { formatDuration, formatSnapshot, formatUsd, noData } from "./format";
import { computeScore } from "./score";
import type {
  ChartModel,
  Dataset,
  Goal,
  LoopRecord,
  OneOff,
  RunRecord,
  RunStatus,
  SpecContent,
  Summary,
} from "./types";

type StatusEntry = {
  enabled?: boolean;
  last_run?: string;
  lastRun?: string;
  result?: string | null;
  next_run?: string;
  nextRun?: string;
  kpis?: Record<string, number> | string;
  dependency_ok?: boolean;
};

type StatusFile = {
  generated_at?: string;
  loops?: Record<string, StatusEntry> | Array<StatusEntry & { id?: string }>;
  one_offs?: Array<Record<string, unknown>>;
};

const SKIP_FILES = new Set(["readme.md", "edit-protocol.md"]);

function readText(file: string): string {
  return fs.readFileSync(file, "utf8");
}

function splitFrontMatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, body: raw };
  const data = parseYaml(match[1]);
  const body = raw.slice(match[0].length);
  return { data: data && typeof data === "object" ? (data as Record<string, unknown>) : {}, body };
}

function sectionsOf(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const parts = body.split(/^##\s+/m);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const newline = trimmed.indexOf("\n");
    const title = (newline === -1 ? trimmed : trimmed.slice(0, newline)).trim().toLowerCase();
    const content = newline === -1 ? "" : trimmed.slice(newline + 1).trim();
    sections[title] = content;
  }
  return sections;
}

function plain(text: string | undefined): string {
  if (!text) return noData();
  const cleaned = text
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^---+$/gm, "")
    .trim();
  return cleaned || noData();
}

function bullets(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => plain(line.slice(2)))
    .filter((line) => line && line !== noData());
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function isNoneDefined(value: unknown): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === "none defined yet";
}

function asGoals(value: unknown): Goal[] {
  if (isNoneDefined(value) || !Array.isArray(value)) return [];
  const goals: Goal[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name = asString(row.name) ?? asString(row.kpi);
    const kpi = asString(row.kpi) ?? name;
    const target = typeof row.target === "number" ? row.target : Number(row.target);
    const weight = typeof row.weight === "number" ? row.weight : Number(row.weight ?? 1);
    if (!name || !kpi || !Number.isFinite(target) || !Number.isFinite(weight)) continue;
    const goal: Goal = {
      name,
      kpi,
      target,
      unit: asString(row.unit) ?? "count",
      weight,
    };
    if (row.direction === "lower" || row.direction === "higher") goal.direction = row.direction;
    if (typeof row.targetMin === "number") goal.targetMin = row.targetMin;
    if (typeof row.targetMax === "number") goal.targetMax = row.targetMax;
    goals.push(goal);
  }
  return goals;
}

function asKpiMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const num = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(num)) out[key] = num;
  }
  return out;
}

function parseRun(line: string, fallbackLoopId: string): RunRecord | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const raw = JSON.parse(trimmed) as Record<string, unknown>;
  const status = raw.status;
  const runStatus: RunStatus =
    status === "failed" || status === "reverted" || status === "ok" ? status : "ok";
  const post = (raw.post && typeof raw.post === "object" ? raw.post : {}) as Record<string, unknown>;
  const changedRaw = Array.isArray(post.changed) ? post.changed : [];
  const suggestedRaw = Array.isArray(post.suggested) ? post.suggested : [];
  const kpis = asKpiMap(raw.kpis);
  return {
    loop_id: asString(raw.loop_id) ?? fallbackLoopId,
    n: typeof raw.n === "number" ? raw.n : Number(raw.n ?? 0),
    started_at: asString(raw.started_at) ?? "",
    duration_s: typeof raw.duration_s === "number" ? raw.duration_s : Number.NaN,
    cost_usd: typeof raw.cost_usd === "number" ? raw.cost_usd : Number.NaN,
    status: runStatus,
    kpis,
    score: typeof raw.score === "number" ? raw.score : null,
    score_delta: typeof raw.score_delta === "number" ? raw.score_delta : null,
    post: {
      headline: asString(post.headline) ?? noData(),
      summary: asString(post.summary) ?? noData(),
      changed: changedRaw
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const row = item as Record<string, unknown>;
          const text = asString(row.text);
          const url = asString(row.url);
          if (!text || !url) return null;
          return { text, url };
        })
        .filter((item): item is { text: string; url: string } => item !== null),
      evals: [],
      suggested: suggestedRaw.map((item) => asString(item)).filter((item): item is string => Boolean(item)),
    },
  };
}

function readRuns(file: string, loopId: string): RunRecord[] {
  if (!fs.existsSync(file)) return [];
  const lines = readText(file).split(/\r?\n/);
  const runs = lines.map((line) => parseRun(line, loopId)).filter((run): run is RunRecord => run !== null);
  runs.sort((a, b) => a.n - b.n);
  for (let index = 0; index < runs.length; index += 1) {
    const run = runs[index];
    const previous = runs[index - 1];
    if (run.post.evals.length > 0) continue;
    const evals: { text: string }[] = [];
    for (const [kpi, value] of Object.entries(run.kpis)) {
      const before = previous?.kpis[kpi];
      if (before == null) evals.push({ text: `${kpi} → ${value}` });
      else if (before === value) evals.push({ text: `${kpi} ${before} → ${value}` });
      else evals.push({ text: `${kpi} ${before} → ${value}` });
    }
    if (run.score != null && previous?.score != null) {
      evals.unshift({ text: `Score ${previous.score} → ${run.score}` });
    }
    run.post.evals = evals;
    if (run.score != null && previous?.score != null && run.score_delta == null) {
      run.score_delta = Math.round((run.score - previous.score) * 10) / 10;
    }
  }
  return runs;
}

function statusMap(file: StatusFile | null): Record<string, StatusEntry> {
  const source = file?.loops;
  if (!source) return {};
  if (Array.isArray(source)) {
    const out: Record<string, StatusEntry> = {};
    for (const entry of source) {
      if (entry?.id) out[entry.id] = entry;
    }
    return out;
  }
  return source;
}

function chartFromRuns(runs: RunRecord[], goals: Goal[], score: number | null, target: number | null): ChartModel {
  const scored = runs.filter((run) => run.score != null);
  const composite = scored.map((run) => run.score as number);
  const kpiKeys = goals.map((goal) => goal.kpi).filter((kpi, index, all) => all.indexOf(kpi) === index).slice(0, 3);
  const colors = ["#A78BFA", "#5CC8C8", "#F2B45C"];
  const series = kpiKeys.map((key, index) => ({
    key,
    label: key,
    color: colors[index] ?? "#C3CCD6",
    values: scored.map((run) => run.kpis[key]).filter((value): value is number => typeof value === "number"),
  })).filter((seriesItem) => seriesItem.values.length === composite.length && seriesItem.values.length > 0);

  const nums = [...composite, ...series.flatMap((item) => item.values)];
  if (target != null) nums.push(target);
  if (score != null) nums.push(score);
  let yMin = 0;
  let yMax = 100;
  if (nums.length > 0) {
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const pad = Math.max(2, (max - min) * 0.12);
    yMin = Math.floor(min - pad);
    yMax = Math.ceil(max + pad);
    if (yMin === yMax) {
      yMin -= 5;
      yMax += 5;
    }
  }
  const tickLabels =
    composite.length === 0
      ? []
      : [0, Math.floor((composite.length - 1) / 2), composite.length - 1].map((index) => ({
          index,
          text: scored[index]?.started_at ? formatSnapshot(scored[index].started_at).split(",")[0] : "no data",
        }));
  return { tickLabels, composite, series, target, yMin, yMax };
}

function fixFor(reason: BlockReason, result: string | null): string {
  if (result === "expired_login") return "Reconnect account";
  if (result === "budget_hit") return "Raise budget";
  if (result === "missing_key") return "Review settings";
  if (reason === "dependency") return "Reconnect account";
  return "Retry";
}

function blockerTitle(reason: BlockReason, result: string | null): string {
  if (result === "expired_login") return "Account session expired";
  if (result === "budget_hit") return "Budget hit";
  if (result === "missing_key") return "Missing key";
  if (reason === "two_failed") return "Two runs in a row failed";
  if (reason === "latest_failed") return "Latest run failed";
  return "Dependency check failed";
}

export function loadPrivate(dir: string): Dataset {
  const emptySummary: Summary = { snapshotLabel: noData(), runsToday: Number.NaN, costWeek: Number.NaN };
  if (!dir || !fs.existsSync(dir)) {
    return { mode: "private", loops: [], runsByLoop: {}, oneOffs: [], summary: emptySummary };
  }

  let status: StatusFile | null = null;
  const statusPath = path.join(dir, "status.json");
  if (fs.existsSync(statusPath)) {
    status = JSON.parse(readText(statusPath)) as StatusFile;
  }
  const byId = statusMap(status);
  const summary: Summary = {
    snapshotLabel: status?.generated_at ? formatSnapshot(status.generated_at) : noData(),
    runsToday: Number.NaN,
    costWeek: Number.NaN,
  };

  const oneOffs: OneOff[] = (status?.one_offs ?? []).map((item, index) => ({
    id: asString(item.id) ?? `one-off-${index + 1}`,
    reminder: asString(item.reminder) ?? noData(),
    due: asString(item.due) ?? noData(),
    status: asString(item.status) ?? noData(),
  }));

  const runsByLoop: Record<string, RunRecord[]> = {};
  const loops: LoopRecord[] = [];
  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".md"));
  for (const file of files) {
    if (file.startsWith("_") || SKIP_FILES.has(file.toLowerCase())) continue;
    const full = path.join(dir, file);
    const { data, body } = splitFrontMatter(readText(full));
    const section = sectionsOf(body);
    const id = asString(data.id) ?? file.replace(/\.md$/, "");
    const runs = readRuns(path.join(dir, "runs", `${id}.jsonl`), id);
    runsByLoop[id] = runs;
    const entry = byId[id] ?? {};
    const result = asString(entry.result);
    const newestFirst = [...runs].sort((a, b) => b.n - a.n);
    const reason = blockedReason({
      runStatuses: newestFirst.map((run) => run.status),
      dependencyFailed: entry.dependency_ok === false,
      result,
    });
    const declared = asString(data.status);
    let loopStatus: LoopRecord["status"] = "running";
    if (entry.enabled === false || declared === "paused") loopStatus = "paused";
    else if (declared === "blocked" || reason) loopStatus = "blocked";

    const noneGoals = isNoneDefined(data.kpis) || isNoneDefined(data.okrs);
    const goals = noneGoals ? [] : asGoals(data.okrs);
    const schedule = (data.schedule && typeof data.schedule === "object" ? data.schedule : {}) as Record<string, unknown>;
    const statusKpis = asKpiMap(entry.kpis);
    const frontKpis = isNoneDefined(data.kpis) ? {} : asKpiMap(data.kpis);
    const latestKpis = newestFirst[0]?.kpis ?? {};
    const values = { ...frontKpis, ...latestKpis, ...statusKpis };
    const score = goals.length > 0 ? computeScore(goals, values) : null;
    const scoreState: LoopRecord["scoreState"] =
      goals.length === 0 ? "no-goals" : score == null ? "no-data" : "scored";
    const primary = [...goals].sort((a, b) => b.weight - a.weight)[0];
    const target = primary && primary.weight > 0 ? primary.target : null;

    const finiteDurations = runs.map((run) => run.duration_s).filter((value) => Number.isFinite(value));
    const finiteCosts = runs.map((run) => run.cost_usd).filter((value) => Number.isFinite(value));
    const avgDuration = finiteDurations.length >= 3 ? finiteDurations.reduce((sum, value) => sum + value, 0) / finiteDurations.length : null;
    const avgCost = finiteCosts.length >= 3 ? finiteCosts.reduce((sum, value) => sum + value, 0) / finiteCosts.length : null;
    const costToDate = finiteCosts.length > 0 ? finiteCosts.reduce((sum, value) => sum + value, 0) : null;
    const successes = runs.filter((run) => run.status === "ok").length;
    const successRate = runs.length > 0 ? `${Math.round((successes / runs.length) * 100)}%` : noData();

    const created = asString(data.created);
    const initiatedLabel = created ? formatSnapshot(created.includes("T") ? created : `${created}T19:00:00.000Z`).split(",")[0] : noData();
    const scheduleWords = asString(schedule.words) ?? noData();
    const nextRaw = asString(entry.next_run) ?? asString(entry.nextRun);
    const nextRunLabel = nextRaw ? (nextRaw.includes("T") ? formatSnapshot(nextRaw) : nextRaw) : noData();

    const flags: LoopRecord["flags"] = [];
    const blockers: LoopRecord["blockers"] = [];
    if (loopStatus === "blocked" && reason) {
      const latest = newestFirst[0];
      blockers.push({
        title: blockerTitle(reason, result),
        detail: plain(section["run history and notes"]),
        runN: latest && Number.isFinite(latest.n) ? latest.n : null,
        when: latest?.started_at ? formatSnapshot(latest.started_at) : noData(),
        fix: fixFor(reason, result),
      });
      flags.push({ kind: "blocker", text: `⚑ Blocked · ${blockers.length} warnings` });
    } else if (loopStatus === "blocked") {
      flags.push({ kind: "blocker", text: "⚑ Blocked · 1 warnings" });
      blockers.push({
        title: "Blocked",
        detail: noData(),
        runN: newestFirst[0]?.n ?? null,
        when: noData(),
        fix: "Retry",
      });
    }
    if (scoreState === "no-goals") {
      flags.push({ kind: "input", text: "Needs input · 1" });
    }

    const scoredRuns = runs.filter((run) => run.score != null);
    const sparkline = scoredRuns.slice(-14).map((run) => run.score as number);
    let delta14d: number | null = null;
    let delta14dLabel = noData();
    const latestScore = scoredRuns.at(-1)?.score ?? score;
    const firstScore = scoredRuns[0]?.score ?? null;
    const deltaSince =
      latestScore != null && firstScore != null ? Math.round((latestScore - firstScore) * 10) / 10 : null;
    if (scoredRuns.length >= 2) {
      const latestTime = Date.parse(scoredRuns.at(-1)?.started_at ?? "");
      const targetTime = latestTime - 14 * 24 * 60 * 60 * 1000;
      let nearest: RunRecord | null = null;
      let nearestGap = Number.POSITIVE_INFINITY;
      for (const run of scoredRuns) {
        const gap = Math.abs(Date.parse(run.started_at) - targetTime);
        if (gap < nearestGap) {
          nearest = run;
          nearestGap = gap;
        }
      }
      if (nearest && nearest.score != null && latestScore != null && nearestGap <= 36 * 60 * 60 * 1000) {
        delta14d = Math.round((latestScore - nearest.score) * 10) / 10;
        delta14dLabel = delta14d === 0 ? "steady" : `${delta14d > 0 ? "+" : ""}${delta14d.toFixed(1)} in 14 days`;
      }
    }

    const spec: SpecContent = {
      version: asString(data.spec_version) ?? noData(),
      editedLabel: asString(data.edited) ?? created ?? noData(),
      reconstructed: data.reconstructed === true,
      purpose: plain(section.objective),
      scope: {
        products: noData(),
        allowed: noData(),
        notAllowed: noData(),
      },
      steps: bullets(section.roadmap),
      inputs: bullets(section["sources and instructions"]),
      runtime: {
        schedule: scheduleWords,
        timeLimit: asString(data.time_limit) ?? noData(),
        budget: asString(data.budget) ?? noData(),
        model: asString(data.model) ?? noData(),
      },
    };

    const goalRows = goals.map((goal) => {
      const value = values[goal.kpi];
      return {
        goal: goal.name,
        kpi: goal.kpi,
        now: value == null ? noData() : String(value),
        target: String(goal.target),
        lastRun: noData(),
        tone: "flat" as const,
      };
    });
    const progressRows = goals.map((goal, index) => {
      const value = values[goal.kpi];
      const progress =
        value == null || goal.target === 0 ? 0 : Math.max(0, Math.min(100, (value / goal.target) * 100));
      return {
        label: goal.name,
        valueLabel: value == null ? noData() : String(value),
        goalLabel: `goal ${goal.target}`,
        progress,
        color: ["#5CD68C", "#A78BFA", "#5CC8C8", "#F2B45C"][index % 4],
      };
    });

    const chips = Object.entries(values)
      .slice(0, 3)
      .map(([label, value]) => ({ label, value: String(value) }));

    const loop: LoopRecord = {
      id,
      name: asString(data.name) ?? id,
      status: loopStatus,
      scoreState,
      initiatedLabel,
      scheduleWords,
      scheduleCron: asString(schedule.cron) ?? noData(),
      timezone: asString(schedule.timezone) ?? noData(),
      nextRunLabel,
      score: scoreState === "scored" ? score : null,
      target: scoreState === "scored" ? target : null,
      delta14d,
      delta14dLabel,
      deltaSinceStartLabel: deltaSince == null ? noData() : `${deltaSince > 0 ? "+" : ""}${deltaSince.toFixed(1)} since start`,
      kpiChips: scoreState === "no-goals" ? [] : chips,
      runsMeta: runs.length > 0 ? `${runs.length} · since ${initiatedLabel}` : "No runs yet",
      costMeta:
        avgCost != null && avgDuration != null
          ? `${formatUsd(avgCost)}/run · ${formatDuration(avgDuration)}`
          : noData(),
      flags,
      suggestions:
        scoreState === "no-goals"
          ? [
              {
                id: `${id}-goals`,
                title: "Define goals and KPIs",
                detail: "This loop has no goals yet, so it cannot earn a score.",
                canEdit: true,
              },
            ]
          : [],
      stats: {
        initiated: initiatedLabel,
        runs: runs.length > 0 ? String(runs.length) : "No runs yet",
        successRate,
        avgDuration: avgDuration == null ? noData() : formatDuration(avgDuration),
        costPerRun: avgCost == null ? noData() : formatUsd(avgCost),
        costToDate: costToDate == null ? noData() : formatUsd(costToDate),
      },
      sparkline,
      chart: chartFromRuns(runs, goals, score, target),
      blockers,
      spec,
      goalRows,
      progressRows,
      goalNotes: [],
      evals: bullets(section["evaluation and measurement"]).length
        ? bullets(section["evaluation and measurement"])
        : [plain(section["evaluation and measurement"])],
      guardrails: bullets(section.guardrails).length ? bullets(section.guardrails) : [noData()],
      qc: [plain(section["quality control"])],
      listRank: loops.length,
    };
    loops.push(loop);
  }

  loops.sort((a, b) => a.name.localeCompare(b.name));
  return { mode: "private", loops, runsByLoop, oneOffs, summary };
}
