"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LoopRecord, RetiredLoop } from "@/lib/types";
import { cardStatusOf, type LoopSummary } from "@/lib/status";
import { Drawer } from "./Drawer";
import { GoalsPanel } from "./GoalsPanel";
import { LoopCard } from "./LoopCard";
import { SpecPanel } from "./SpecPanel";

type Pill = "all" | "attention" | "running" | "paused";
type TileFilter = "blocked" | "input" | null;

function money(value: number): string {
  if (!Number.isFinite(value)) return "no data";
  return `$${value.toFixed(2)}`;
}

function matches(status: ReturnType<typeof cardStatusOf>, pill: Pill, tile: TileFilter): boolean {
  if (tile === "blocked") return status === "blocked";
  if (tile === "input") return status === "input";
  if (pill === "attention") return status === "blocked" || status === "input";
  if (pill === "running") return status !== "paused";
  if (pill === "paused") return status === "paused";
  return true;
}

export function Dashboard({
  loops,
  counts,
  oneOffCount,
  runsToday,
  costWeek,
  retired = [],
  mode = "sample",
}: {
  loops: LoopRecord[];
  counts: LoopSummary;
  oneOffCount: number;
  runsToday: number;
  costWeek: number;
  retired?: RetiredLoop[];
  mode?: "sample" | "private";
}) {
  const [pill, setPill] = useState<Pill>("all");
  const [tile, setTile] = useState<TileFilter>(null);
  const [query, setQuery] = useState("");
  // Private mode lists every loop, paused included. Sample mode stays collapsed.
  const [expanded, setExpanded] = useState(mode === "private");
  const [drawer, setDrawer] = useState<{ id: string; kind: "spec" | "goals" } | null>(null);

  const attention = useMemo(
    () =>
      loops
        .filter((loop) => {
          const status = cardStatusOf(loop);
          return status === "blocked" || status === "input";
        })
        .sort((a, b) => {
          const left = cardStatusOf(a);
          const right = cardStatusOf(b);
          if (left !== right) return left === "blocked" ? -1 : 1;
          return a.listRank - b.listRank;
        }),
    [loops],
  );
  const running = useMemo(
    () => loops.filter((loop) => cardStatusOf(loop) === "running").sort((a, b) => a.listRank - b.listRank),
    [loops],
  );
  const paused = useMemo(
    () => loops.filter((loop) => cardStatusOf(loop) === "paused").sort((a, b) => a.listRank - b.listRank),
    [loops],
  );

  function visible(loop: LoopRecord, indexInRunning = -1): boolean {
    const status = cardStatusOf(loop);
    const needle = query.trim().toLowerCase();
    if (needle && !loop.name.toLowerCase().includes(needle)) return false;
    if (!matches(status, pill, tile)) return false;
    if (needle || pill !== "all" || tile) return true;
    if (status === "paused") return expanded;
    if (status === "running") return expanded || indexInRunning < 6;
    return true;
  }

  const runningVisible = running.map((loop, index) => visible(loop, index));
  const attentionVisible = attention.map((loop) => visible(loop));
  const pausedVisible = paused.map((loop) => visible(loop));
  const anyVisible = runningVisible.some(Boolean) || attentionVisible.some(Boolean) || pausedVisible.some(Boolean);
  const showToggle = pill === "all" && tile === null && query.trim() === "" && (counts.hiddenRunning > 0 || counts.paused > 0);
  const drawerLoop = loops.find((loop) => loop.id === drawer?.id) ?? null;
  const deltaClass = counts.avgDelta != null && counts.avgDelta < 0 ? "delta-down" : "delta-up";

  function selectPill(next: Pill) {
    setPill(next);
    setTile(null);
  }

  return (
    <div className="dashboard">
      <p className="page-kicker">LOOPER</p>
      <h1 className="page-title">Your loops</h1>
      <p className="lede">
        {mode === "private"
          ? "Every agent loop, running or paused: health, score, schedule and cost, at a glance."
          : "Every agent loop that is running: health, score, schedule and cost, at a glance."}
      </p>

      <div data-testid="summary-tiles" className="tiles">
        <div data-tile="loops" data-panel="" className="tile">
          <div className="tile-label">Loops</div>
          <div className="tile-value">{counts.total}</div>
          <div className="tile-sub">{counts.running} running</div>
        </div>
        <button
          type="button"
          data-tile="blocked"
          data-panel=""
          className="tile"
          aria-pressed={tile === "blocked"}
          onClick={() => {
            setTile((current) => (current === "blocked" ? null : "blocked"));
            setPill("all");
          }}
        >
          <div className="tile-label">Blocked</div>
          <div className="tile-value">{counts.blocked}</div>
        </button>
        <button
          type="button"
          data-tile="needs-input"
          data-panel=""
          className="tile"
          aria-pressed={tile === "input"}
          onClick={() => {
            setTile((current) => (current === "input" ? null : "input"));
            setPill("all");
          }}
        >
          <div className="tile-label">Need your input</div>
          <div className="tile-value">{counts.needsInput}</div>
        </button>
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

      <div className="filters">
        <button type="button" data-filter="all" className="pill" aria-pressed={pill === "all" && tile === null} onClick={() => selectPill("all")}>
          All {counts.total}
        </button>
        <button type="button" data-filter="attention" className="pill" aria-pressed={pill === "attention"} onClick={() => selectPill("attention")}>
          Needs attention <span className="alert-count">{counts.attentionFlags}</span>
        </button>
        <button type="button" data-filter="running" className="pill" aria-pressed={pill === "running"} onClick={() => selectPill("running")}>
          Running {counts.running}
        </button>
        <button type="button" data-filter="paused" className="pill" aria-pressed={pill === "paused"} onClick={() => selectPill("paused")}>
          Paused {counts.paused}
        </button>
        <Link data-filter="oneoffs" className="pill" href="/looper/one-offs">
          One-offs {oneOffCount}
        </Link>
        <input
          data-testid="search"
          className="search"
          type="search"
          placeholder="Search loops"
          aria-label="Search loops"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <section data-section="attention" hidden={!attentionVisible.some(Boolean)}>
        <div className="section-head">
          <h2>Needs attention</h2>
          <p>Blocked first, then waiting on you</p>
        </div>
        <div className="cards">
          {attention.map((loop, index) => (
            <LoopCard key={loop.id} loop={loop} hidden={!attentionVisible[index]} onSpec={(id) => setDrawer({ id, kind: "spec" })} onGoals={(id) => setDrawer({ id, kind: "goals" })} />
          ))}
        </div>
      </section>

      <section data-section="running" hidden={!runningVisible.some(Boolean)}>
        <div className="section-head">
          <h2>Running</h2>
          <p>Sorted by score vs. target</p>
        </div>
        <div className="cards">
          {running.map((loop, index) => (
            <LoopCard key={loop.id} loop={loop} hidden={!runningVisible[index]} onSpec={(id) => setDrawer({ id, kind: "spec" })} onGoals={(id) => setDrawer({ id, kind: "goals" })} />
          ))}
        </div>
      </section>

      {showToggle ? (
        <button type="button" data-testid="show-more" className="show-more" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Show less" : counts.showMoreLabel}
        </button>
      ) : null}

      <section data-section="paused" hidden={!pausedVisible.some(Boolean)}>
        <div className="section-head">
          <h2>Paused</h2>
          <p>Not on the schedule right now</p>
        </div>
        <div className="cards">
          {paused.map((loop, index) => (
            <LoopCard key={loop.id} loop={loop} hidden={!pausedVisible[index]} onSpec={(id) => setDrawer({ id, kind: "spec" })} onGoals={(id) => setDrawer({ id, kind: "goals" })} />
          ))}
        </div>
      </section>

      {anyVisible ? null : <p className="empty">No loops match.</p>}

      {mode === "private" && retired.length > 0 && pill === "all" && tile === null && query.trim() === "" ? (
        <section data-section="retired">
          <div className="section-head">
            <h2>Retired</h2>
            <p>Archived loops. Their routines are paused or removed; restore with tools/loop-edits.py restore.</p>
          </div>
          <ul className="retired-list">
            {retired.map((item) => (
              <li key={item.id} data-retired={item.id} data-panel="" className="retired-item">
                <strong>{item.name}</strong>
                <p>{item.purpose}</p>
                <p className="muted">{item.note}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {drawer && drawerLoop ? (
        <Drawer testId={drawer.kind === "spec" ? "drawer-spec" : "drawer-goals"} title={drawerLoop.name} onClose={() => setDrawer(null)}>
          {drawer.kind === "spec" ? <SpecPanel loop={drawerLoop} /> : <GoalsPanel loop={drawerLoop} />}
        </Drawer>
      ) : null}
    </div>
  );
}
