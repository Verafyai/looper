import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Dashboard } from "@/components/Dashboard";
import { SpecPanel } from "@/components/SpecPanel";
import { loadDataset } from "@/lib/adapter";
import { loadSample } from "@/lib/sample";
import { summarizeLoops } from "@/lib/status";

const privateDir = `${process.cwd()}/tests/fixtures/private`;

function cardHidden(html: string, id: string): boolean {
  const match = html.match(new RegExp(`<article[^>]*data-loop-card="${id}"[^>]*>`));
  expect(match, id).not.toBeNull();
  return match?.[0].includes("hidden") ?? false;
}

describe("dashboard mode", () => {
  it("keeps sample data collapsed and without a retired section", () => {
    const data = loadSample();
    const html = renderToStaticMarkup(
      <Dashboard
        loops={data.loops}
        counts={summarizeLoops(data.loops)}
        oneOffCount={data.oneOffs.length}
        runsToday={data.summary.runsToday}
        costWeek={data.summary.costWeek}
        mode="sample"
      />,
    );
    expect(html).toContain("Every agent loop that is running");
    expect(html).not.toContain('data-section="retired"');
    const paused = data.loops.filter((loop) => loop.status === "paused");
    expect(paused.length).toBeGreaterThan(0);
    for (const loop of paused) expect(cardHidden(html, loop.id)).toBe(true);
  });

  it("shows every private loop, including paused, and the retired section", () => {
    const data = loadDataset({ LOOPER_DATA_MODE: "private", LOOPER_DATA_DIR: privateDir });
    const html = renderToStaticMarkup(
      <Dashboard
        loops={data.loops}
        counts={summarizeLoops(data.loops)}
        oneOffCount={data.oneOffs.length}
        runsToday={data.summary.runsToday}
        costWeek={data.summary.costWeek}
        retired={data.retired ?? []}
        mode="private"
      />,
    );
    expect(html).toContain("Every agent loop, running or paused");
    expect(cardHidden(html, "full-spec")).toBe(false);
    expect(cardHidden(html, "demo-loop")).toBe(false);
    expect(html).toContain('data-section="retired"');
    expect(html).toContain("Old digest");
    expect(html).toContain("Retired on Oct 1 after the digest moved");
  });
});

describe("spec panel", () => {
  it("keeps sample specs on the original sections", () => {
    const loop = loadSample().loops.find((item) => item.id === "nightly-polish-run");
    expect(loop).toBeTruthy();
    const html = renderToStaticMarkup(<SpecPanel loop={loop!} />);
    expect(html).toContain('data-spec-section="scope"');
    expect(html).toContain('data-spec-section="steps"');
    expect(html).not.toContain('data-spec-section="outputs"');
    expect(html).not.toContain('data-spec-section="approvals"');
    expect(html).not.toContain(">Owner<");
    expect(html).not.toContain(">Last run<");
    expect(html).toContain("reconstructed from the routine");
  });

  it("shows the private spec sections and the reconstructed label", () => {
    const data = loadDataset({ LOOPER_DATA_MODE: "private", LOOPER_DATA_DIR: privateDir });
    const loop = data.loops.find((item) => item.id === "full-spec");
    expect(loop).toBeTruthy();
    const html = renderToStaticMarkup(<SpecPanel loop={loop!} />);
    for (const section of ["scope", "steps", "outputs", "approvals", "guardrails"]) {
      expect(html).toContain(`data-spec-section="${section}"`);
    }
    expect(html).toContain("Looper, the docs site");
    expect(html).toContain("Collect the notes");
    expect(html).toContain("A brief in the log");
    expect(html).toContain("Publish the brief");
    expect(html).toContain("Do not email customers");
    expect(html).toContain(">Owner<");
    expect(html).toContain(">Rex<");
    expect(html).toContain(">Last run<");
    expect(html).toContain("2026-10-15");
    expect(html).toContain("reconstructed from the routine");
  });
});
