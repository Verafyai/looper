"use client";

import type { LoopRecord } from "@/lib/types";
import { cardStatusOf, summarizeLoops } from "@/lib/status";
import { GoalsPanel } from "./GoalsPanel";
import { LoopCard } from "./LoopCard";
import { LoopPage } from "./LoopPage";
import { SpecPanel } from "./SpecPanel";

function money(value: number): string {
  if (!Number.isFinite(value)) return "no data";
  return `$${value.toFixed(2)}`;
}

function noop() {}

export function ProductVisuals({
  loops,
  runsToday,
  costWeek,
}: {
  loops: LoopRecord[];
  runsToday: number;
  costWeek: number;
}) {
  const counts = summarizeLoops(loops);
  const attention = loops
    .filter((loop) => {
      const status = cardStatusOf(loop);
      return status === "blocked" || status === "input";
    })
    .sort((a, b) => {
      const left = cardStatusOf(a);
      const right = cardStatusOf(b);
      if (left !== right) return left === "blocked" ? -1 : 1;
      return a.listRank - b.listRank;
    });
  const running = loops
    .filter((loop) => cardStatusOf(loop) === "running")
    .sort((a, b) => a.listRank - b.listRank)
    .slice(0, 3);
  const nightly = loops.find((loop) => loop.id === "nightly-polish-run") ?? null;
  const deltaClass = counts.avgDelta != null && counts.avgDelta < 0 ? "delta-down" : "delta-up";

  return (
    <div className="product-stack">
      <article data-product-visual="dashboard" data-panel="" className="product-visual">
        <p data-testid="sample-label" className="sample-label">
          Sample data
        </p>
        <div className="visual-frame" inert>
          <div data-testid="summary-tiles" className="tiles">
            <div data-tile="loops" data-panel="" className="tile">
              <div className="tile-label">Loops</div>
              <div className="tile-value">{counts.total}</div>
              <div className="tile-sub">{counts.running} running</div>
            </div>
            <div data-tile="blocked" data-panel="" className="tile">
              <div className="tile-label">Blocked</div>
              <div className="tile-value">{counts.blocked}</div>
            </div>
            <div data-tile="needs-input" data-panel="" className="tile">
              <div className="tile-label">Need your input</div>
              <div className="tile-value">{counts.needsInput}</div>
            </div>
            <div data-tile="avg-score" data-panel="" className="tile">
              <div className="tile-label">Average score</div>
              <div className="tile-value">{counts.avgScore == null ? "no data" : counts.avgScore.toFixed(1)}</div>
              <div className={`tile-sub ${deltaClass}`}>
                {counts.avgDelta == null ? "no data" : `${counts.avgDelta > 0 ? "+" : ""}${counts.avgDelta.toFixed(1)} / 14d`}
              </div>
            </div>
            <div data-tile="runs-today" data-panel="" className="tile">
              <div className="tile-label">Runs today</div>
              <div className="tile-value">{Number.isFinite(runsToday) ? runsToday : "no data"}</div>
            </div>
            <div data-tile="cost-week" data-panel="" className="tile">
              <div className="tile-label">Cost this week</div>
              <div className="tile-value">{money(costWeek)}</div>
            </div>
          </div>
          <div className="section-head">
            <h2>Needs attention</h2>
            <p>Blocked first, then waiting on you</p>
          </div>
          <div className="cards">
            {attention.map((loop) => (
              <LoopCard key={loop.id} loop={loop} hidden={false} onSpec={noop} onGoals={noop} />
            ))}
          </div>
          <div className="section-head">
            <h2>Running</h2>
            <p>Sorted by score vs. target</p>
          </div>
          <div className="cards">
            {running.map((loop) => (
              <LoopCard key={loop.id} loop={loop} hidden={false} onSpec={noop} onGoals={noop} />
            ))}
          </div>
        </div>
      </article>

      {nightly ? (
        <article data-product-visual="loop" data-panel="" className="product-visual">
          <p data-testid="sample-label" className="sample-label">
            Sample data
          </p>
          <div className="visual-frame" inert>
            <LoopPage loop={nightly} runs={[]} preview />
          </div>
        </article>
      ) : null}

      {nightly ? (
        <article data-product-visual="specgoals" data-panel="" className="product-visual">
          <p data-testid="sample-label" className="sample-label">
            Sample data
          </p>
          <div className="visual-frame spec-grid split" inert>
            <SpecPanel loop={nightly} />
            <GoalsPanel loop={nightly} />
          </div>
        </article>
      ) : null}
    </div>
  );
}
