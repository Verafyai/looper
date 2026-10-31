export type LoopStatus = "running" | "paused" | "blocked";
export type CardStatus = "blocked" | "input" | "running" | "paused";
export type RunStatus = "ok" | "reverted" | "failed";
export type FlagKind = "blocker" | "input";
export type GoalDirection = "higher" | "lower";
export type GoalTone = "up" | "down" | "flat" | "met";

export type Goal = {
  name: string;
  kpi: string;
  target: number;
  unit: string;
  weight: number;
  direction?: GoalDirection;
  targetMin?: number;
  targetMax?: number;
};

export type Flag = {
  kind: FlagKind;
  text: string;
};

export type KpiChip = {
  label: string;
  value: string;
};

export type Suggestion = {
  id: string;
  title: string;
  detail: string;
  canEdit: boolean;
};

export type Blocker = {
  title: string;
  detail: string;
  runN: number | null;
  when: string;
  fix: string;
};

export type SpecContent = {
  version: string;
  editedLabel: string;
  reconstructed: boolean;
  purpose: string;
  scope: {
    products: string;
    allowed: string;
    notAllowed: string;
  };
  steps: string[];
  inputs: string[];
  runtime: {
    schedule: string;
    timeLimit: string;
    budget: string;
    model: string;
  };
};

export type GoalRow = {
  goal: string;
  kpi: string;
  now: string;
  target: string;
  lastRun: string;
  tone: GoalTone;
};

export type ProgressRow = {
  label: string;
  valueLabel: string;
  goalLabel: string;
  progress: number;
  color: string;
};

export type ChartSeries = {
  key: string;
  label: string;
  color: string;
  values: number[];
};

export type ChartModel = {
  tickLabels: { index: number; text: string }[];
  composite: number[];
  series: ChartSeries[];
  target: number | null;
  yMin: number;
  yMax: number;
  pointHrefs?: string[];
};

export type LoopStats = {
  initiated: string;
  runs: string;
  successRate: string;
  avgDuration: string;
  costPerRun: string;
  costToDate: string;
};

export type ScoreState = "scored" | "no-goals" | "no-data";

export type LoopRecord = {
  id: string;
  name: string;
  status: LoopStatus;
  scoreState: ScoreState;
  initiatedLabel: string;
  scheduleWords: string;
  scheduleCron: string;
  timezone: string;
  nextRunLabel: string;
  score: number | null;
  target: number | null;
  delta14d: number | null;
  delta14dLabel: string;
  deltaSinceStartLabel: string;
  kpiChips: KpiChip[];
  runsMeta: string;
  costMeta: string;
  flags: Flag[];
  suggestions: Suggestion[];
  stats: LoopStats;
  sparkline: number[];
  chart: ChartModel;
  blockers: Blocker[];
  spec: SpecContent;
  goalRows: GoalRow[];
  progressRows: ProgressRow[];
  goalNotes: string[];
  evals: string[];
  guardrails: string[];
  qc: string[];
  listRank: number;
};

export type RunChange = {
  text: string;
  url: string;
};

export type RunEval = {
  text: string;
};

export type RunPost = {
  headline: string;
  summary: string;
  changed: RunChange[];
  evals: RunEval[];
  suggested: string[];
};

export type RunRecord = {
  loop_id: string;
  n: number;
  started_at: string;
  duration_s: number;
  cost_usd: number;
  status: RunStatus;
  kpis: Record<string, number>;
  score: number | null;
  score_delta: number | null;
  post: RunPost;
};

export type OneOff = {
  id: string;
  reminder: string;
  due: string;
  status: string;
};

export type Summary = {
  snapshotLabel: string;
  runsToday: number;
  costWeek: number;
};

export type Dataset = {
  mode: "sample" | "private";
  loops: LoopRecord[];
  runsByLoop: Record<string, RunRecord[]>;
  oneOffs: OneOff[];
  summary: Summary;
};
