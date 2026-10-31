import type { Goal } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Map one KPI onto 0 to 100 against its target.
 * Higher is better: 100 means the value has reached the target.
 * Lower is better: 100 means the value is at or under the target.
 * A target range scores 100 while the value stays inside it.
 */
export function normalizeKpi(value: number, goal: Goal): number {
  if (goal.targetMin != null && goal.targetMax != null) {
    if (value >= goal.targetMin && value <= goal.targetMax) return 100;
    const edge = value < goal.targetMin ? goal.targetMin : goal.targetMax;
    const span = Math.max(goal.targetMax - goal.targetMin, 1);
    return clamp(100 - (Math.abs(value - edge) / span) * 100, 0, 100);
  }

  const direction = goal.direction ?? "higher";
  if (direction === "lower") {
    if (goal.target <= 0) return value <= 0 ? 100 : 0;
    if (value <= goal.target) return 100;
    return clamp(100 - ((value - goal.target) / goal.target) * 100, 0, 100);
  }

  if (goal.target === 0) return 0;
  return clamp((value / goal.target) * 100, 0, 100);
}

/**
 * Weighted average of KPI scores normalized to 0 to 100.
 * Returns null when no goal has a positive weight and a finite value.
 * A weight of 0 keeps a KPI on the goals list without moving the score.
 */
export function computeScore(goals: Goal[], values: Record<string, number>): number | null {
  let weighted = 0;
  let weightSum = 0;
  for (const goal of goals) {
    if (goal.weight <= 0) continue;
    const value = values[goal.kpi];
    if (value == null || !Number.isFinite(value)) continue;
    weighted += normalizeKpi(value, goal) * goal.weight;
    weightSum += goal.weight;
  }
  if (weightSum === 0) return null;
  return round1(weighted / weightSum);
}
