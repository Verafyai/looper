import type { CardStatus, Flag, LoopRecord, LoopStatus, ScoreState } from "./types";

export function cardStatusOf(loop: {
  status: LoopStatus;
  scoreState: ScoreState;
  flags: Flag[];
}): CardStatus {
  if (loop.status === "blocked") return "blocked";
  if (loop.status === "paused") return "paused";
  if (loop.scoreState === "no-goals" || loop.flags.some((flag) => flag.kind === "input")) return "input";
  return "running";
}

export function needsInput(loop: LoopRecord): boolean {
  return loop.scoreState === "no-goals" || loop.flags.some((flag) => flag.kind === "input");
}

export type LoopSummary = {
  total: number;
  running: number;
  paused: number;
  blocked: number;
  needsInput: number;
  attentionFlags: number;
  avgScore: number | null;
  avgDelta: number | null;
  hiddenRunning: number;
  showMoreLabel: string;
};

export function summarizeLoops(loops: LoopRecord[]): LoopSummary {
  const paused = loops.filter((loop) => cardStatusOf(loop) === "paused").length;
  const blocked = loops.filter((loop) => cardStatusOf(loop) === "blocked").length;
  const needsInputCount = loops.filter((loop) => needsInput(loop)).length;
  const attentionFlags = loops.reduce((sum, loop) => sum + loop.flags.length, 0);
  const runningCards = loops.filter((loop) => cardStatusOf(loop) === "running").length;
  const hiddenRunning = Math.max(0, runningCards - 6);
  const scored = loops.filter((loop) => loop.score != null && loop.delta14d != null);
  const avgScore =
    scored.length === 0
      ? null
      : Math.round((scored.reduce((sum, loop) => sum + (loop.score ?? 0), 0) / scored.length) * 10) / 10;
  const avgDelta =
    scored.length === 0
      ? null
      : Math.round((scored.reduce((sum, loop) => sum + (loop.delta14d ?? 0), 0) / scored.length) * 10) / 10;

  return {
    total: loops.length,
    running: loops.length - paused,
    paused,
    blocked,
    needsInput: needsInputCount,
    attentionFlags,
    avgScore,
    avgDelta,
    hiddenRunning,
    showMoreLabel: `Show ${hiddenRunning} more running · ${paused} paused`,
  };
}
