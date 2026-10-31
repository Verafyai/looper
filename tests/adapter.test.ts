import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadDataset } from "@/lib/adapter";
import { formatRunMeta } from "@/lib/format";
import { summarizeLoops } from "@/lib/status";

const privateDir = path.join(process.cwd(), "tests/fixtures/private");

describe("sample adapter", () => {
  const data = loadDataset({});

  it("reads the committed fixtures", () => {
    expect(data.mode).toBe("sample");
    expect(data.loops).toHaveLength(19);
    expect(data.oneOffs).toHaveLength(14);
    expect(data.summary.runsToday).toBe(63);
    expect(data.summary.costWeek).toBe(42.1);
    expect(data.summary.snapshotLabel).toBe("Sat Oct 31, 10:57 AM PT");
  });

  it("includes nightly-polish-run with the sample score and 48 runs", () => {
    const loop = data.loops.find((item) => item.id === "nightly-polish-run");
    expect(loop?.score).toBe(84.9);
    expect(loop?.target).toBe(90);
    expect(loop?.delta14dLabel).toBe("+3.1 in 14 days");
    const runs = data.runsByLoop["nightly-polish-run"];
    expect(runs).toHaveLength(48);
    expect(runs[47].post.headline).toBe("Tightened the Explorer result card and fixed two broken links");
    expect(runs[47].post.evals.some((item) => item.text.includes("→"))).toBe(true);
    expect(runs[46].status).toBe("reverted");
    expect(formatRunMeta(runs[47])).toBe("Run #48 · Fri Oct 30, 11:02 PM PT · 21 min · $1.38");
    expect(formatRunMeta(runs[46])).toBe("Run #47 · Thu Oct 29, 11:01 PM PT · 24 min · $1.46");
  });

  it("matches the dashboard totals", () => {
    const summary = summarizeLoops(data.loops);
    expect(summary.total).toBe(19);
    expect(summary.running).toBe(15);
    expect(summary.paused).toBe(4);
    expect(summary.blocked).toBe(1);
    expect(summary.needsInput).toBe(3);
    expect(summary.attentionFlags).toBe(4);
    expect(summary.avgScore).toBe(81.6);
    expect(summary.avgDelta).toBe(3.2);
    expect(summary.showMoreLabel).toBe("Show 6 more running · 4 paused");
  });
});

describe("private adapter", () => {
  const data = loadDataset({ LOOPER_DATA_MODE: "private", LOOPER_DATA_DIR: privateDir });

  it("skips readme, protocol, and underscore files", () => {
    const ids = data.loops.map((loop) => loop.id);
    expect(ids).not.toContain("should-skip-readme");
    expect(ids).not.toContain("should-skip-protocol");
    expect(ids).not.toContain("should-skip-scratch");
    expect(data.mode).toBe("private");
  });

  it("computes the score from goals and does not invent missing numbers", () => {
    const demo = data.loops.find((loop) => loop.id === "demo-loop");
    expect(demo?.score).toBe(50);
    expect(demo?.scoreState).toBe("scored");
    expect(demo?.stats.costPerRun).toBe("$1.00");
    expect(demo?.stats.avgDuration).toBe("10 min");
    expect(demo?.stats.costToDate).toBe("$4.00");
    expect(demo?.runsMeta).toContain("since");
    expect(demo?.spec.purpose).toBe("Keep the docs accurate.");
    expect(demo?.spec.steps.length).toBeGreaterThanOrEqual(2);
    expect(data.runsByLoop["demo-loop"]).toHaveLength(4);
    expect(data.runsByLoop["demo-loop"][3].post.evals.some((item) => item.text.includes("→"))).toBe(true);
  });

  it("treats none defined yet as no goals and no score", () => {
    const empty = data.loops.find((loop) => loop.id === "empty-goals");
    expect(empty?.score).toBeNull();
    expect(empty?.scoreState).toBe("no-goals");
    expect(empty?.flags.some((flag) => flag.kind === "input")).toBe(true);
    expect(empty?.kpiChips).toEqual([]);
  });

  it("blocks on failed runs and on an expired login", () => {
    const failed = data.loops.find((loop) => loop.id === "failed-loop");
    expect(failed?.status).toBe("blocked");
    expect(failed?.blockers[0]?.fix).toBe("Retry");
    expect(failed?.blockers[0]?.runN).toBe(2);
    expect(failed?.stats.costPerRun).toBe("no data");
    expect(failed?.stats.costToDate).toBe("$4.00");

    const login = data.loops.find((loop) => loop.id === "login-loop");
    expect(login?.status).toBe("blocked");
    expect(login?.blockers[0]?.fix).toBe("Reconnect account");
    expect(login?.spec.purpose).toBe("no data");
    expect(data.runsByLoop["login-loop"]).toEqual([]);
    expect(login?.runsMeta).toBe("No runs yet");
  });

  it("reads the snapshot time and one-offs", () => {
    expect(data.summary.snapshotLabel).toBe("Sat Oct 31, 10:57 AM PT");
    expect(data.oneOffs[0]?.reminder).toBe("Renew domain");
  });
});
