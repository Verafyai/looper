import { describe, expect, it } from "vitest";
import { computeScore, normalizeKpi } from "@/lib/score";
import type { Goal } from "@/lib/types";

function goal(partial: Partial<Goal> & Pick<Goal, "kpi" | "target">): Goal {
  return {
    name: partial.name ?? partial.kpi,
    unit: partial.unit ?? "count",
    weight: partial.weight ?? 1,
    ...partial,
  };
}

describe("score math", () => {
  it("normalizes a higher-is-better KPI against its target", () => {
    expect(normalizeKpi(25, goal({ kpi: "a", target: 50 }))).toBe(50);
    expect(normalizeKpi(80, goal({ kpi: "a", target: 40 }))).toBe(100);
  });

  it("normalizes a lower-is-better KPI", () => {
    const lower = goal({ kpi: "bugs", target: 5, direction: "lower" });
    expect(normalizeKpi(2, lower)).toBe(100);
    expect(normalizeKpi(10, lower)).toBe(0);
  });

  it("scores 100 inside a target range", () => {
    const paced = goal({ kpi: "pace", target: 3, targetMin: 2, targetMax: 3 });
    expect(normalizeKpi(2.6, paced)).toBe(100);
    expect(normalizeKpi(5, paced)).toBe(0);
  });

  it("returns the weighted average and ignores a zero weight", () => {
    const goals = [
      goal({ kpi: "a", target: 100, weight: 1 }),
      goal({ kpi: "b", target: 100, weight: 1 }),
      goal({ kpi: "c", target: 100, weight: 0 }),
    ];
    expect(computeScore(goals, { a: 80, b: 60, c: 0 })).toBe(70);
  });

  it("returns null when there are no usable goals", () => {
    expect(computeScore([], { a: 10 })).toBeNull();
    expect(computeScore([goal({ kpi: "a", target: 10, weight: 0 })], { a: 10 })).toBeNull();
    expect(computeScore([goal({ kpi: "a", target: 10 })], {})).toBeNull();
  });
});
