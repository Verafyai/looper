"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LoopRecord, RunRecord } from "@/lib/types";
import { Drawer } from "./Drawer";
import { GoalsPanel } from "./GoalsPanel";
import { RunPost } from "./RunPost";
import { ScoreChart } from "./ScoreChart";
import { SpecPanel } from "./SpecPanel";

const tabs = ["Progress log", "Spec", "Goals & evals", "Guardrails", "Schedule"] as const;
type Tab = (typeof tabs)[number];

function scheduleLine(words: string): string {
  if (words.includes("PT") || !/\b(AM|PM)\b/.test(words)) return words;
  return `${words} PT`;
}

function nextRunLine(label: string): string {
  if (label === "no data" || label === "Not scheduled") return label;
  const softened = label.replace(/^Tonight/, "tonight").replace(/^Today/, "today");
  return `Next run ${softened}`;
}

function scoreText(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

export function LoopPage({ loop, runs }: { loop: LoopRecord; runs: RunRecord[] }) {
  const [tab, setTab] = useState<Tab>("Progress log");
  const [paused, setPaused] = useState(loop.status === "paused");
  const [queued, setQueued] = useState(false);
  const [page, setPage] = useState(0);
  const [shown, setShown] = useState(Math.min(2, loop.suggestions.length));
  const [approved, setApproved] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [drawer, setDrawer] = useState<"spec" | "goals" | null>(null);

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, []);

  const ordered = [...runs].sort((a, b) => b.n - a.n);
  const pageRuns = ordered.slice(page * 20, page * 20 + 20);
  const statusLabel = paused ? "Paused" : loop.status === "blocked" ? "Blocked" : "Running";
  const sinceClass = loop.deltaSinceStartLabel.startsWith("-") ? "delta-down" : "delta-up";
  const anyApproved = Object.values(approved).some(Boolean);

  return (
    <div className="loop-page">
      <nav data-testid="breadcrumb" className="breadcrumb">
        <Link href="/looper">Loops</Link>
        <span aria-hidden="true"> › </span>
        <span>{loop.name}</span>
      </nav>
      <div className="title-row">
        <div>
          <h1 data-testid="loop-title" className="loop-title">
            {loop.name}
          </h1>
          <div className="flags title-flags">
            {loop.flags.map((flag) => (
              <a
                key={flag.kind}
                data-testid="card-flag"
                data-kind={flag.kind}
                className="flag"
                href={flag.kind === "blocker" ? "#blockers" : "#needs-input"}
              >
                {flag.text}
              </a>
            ))}
            <span data-testid="loop-status">{statusLabel}</span>
            <span data-testid="loop-schedule">{scheduleLine(loop.scheduleWords)}</span>
            <span data-testid="loop-next-run">{nextRunLine(loop.nextRunLabel)}</span>
          </div>
        </div>
        <div className="card-actions">
          <button type="button" data-testid="btn-spec" className="btn" onClick={() => setDrawer("spec")}>
            Spec
          </button>
          <button type="button" data-testid="btn-goals" className="btn" onClick={() => setDrawer("goals")}>
            Goals & evals
          </button>
          {paused ? (
            <button type="button" data-testid="btn-resume" className="btn" onClick={() => setPaused(false)}>
              Resume
            </button>
          ) : (
            <button type="button" data-testid="btn-pause" className="btn" onClick={() => setPaused(true)}>
              Pause
            </button>
          )}
          <button type="button" data-testid="btn-run-now" className="btn btn-primary" onClick={() => setQueued(true)}>
            Run now
          </button>
        </div>
      </div>
      {queued ? <p className="queued">Run queued. It will start on the next pass.</p> : null}

      <div data-testid="stats-row" className="tiles">
        {(
          [
            ["initiated", "Initiated", loop.stats.initiated],
            ["runs", "Runs", loop.stats.runs],
            ["success-rate", "Success rate", loop.stats.successRate],
            ["avg-duration", "Avg duration", loop.stats.avgDuration],
            ["cost-per-run", "Cost per run", loop.stats.costPerRun],
            ["cost-to-date", "Cost to date", loop.stats.costToDate],
          ] as const
        ).map(([key, label, value]) => (
          <div key={key} data-stat={key} data-panel="" className="tile">
            <div className="tile-label">{label}</div>
            <div className="tile-value stat-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="split split-chart">
        <section data-panel="" className="spec-block">
          <div className="chart-head">
            <div>
              <h2>Score over time</h2>
              <p className="section-note">Composite of the loop KPIs, one point per run</p>
            </div>
            <div>
              <div className="card-score">{loop.score == null ? "no data" : scoreText(loop.score)}</div>
              <div className={sinceClass}>{loop.deltaSinceStartLabel}</div>
            </div>
          </div>
          {loop.scoreState === "no-goals" ? (
            <p className="noscore">No score yet. Define goals and KPIs to start tracking progress.</p>
          ) : null}
          <ScoreChart chart={loop.chart} />
        </section>
        <section data-testid="goals-progress" data-panel="" className="spec-block">
          <h2>Progress toward goals</h2>
          {loop.progressRows.length === 0 ? (
            <p>no data</p>
          ) : (
            loop.progressRows.map((row) => (
              <div key={row.label} data-goal-row="" className="goal-row">
                <div className="goal-label-row">
                  <span>{row.label}</span>
                  <strong>{row.valueLabel}</strong>
                </div>
                <div className="bar" aria-hidden="true">
                  <span data-progress="" style={{ width: `${Math.max(0, Math.min(100, row.progress))}%`, background: row.color }} />
                </div>
                <div className="goal-target">{row.goalLabel}</div>
              </div>
            ))
          )}
          {loop.goalNotes.map((note) => (
            <p key={note} className="section-note">
              {note}
            </p>
          ))}
        </section>
      </div>

      <div className="split split-panels">
        <section id="blockers" data-testid="panel-blockers" data-panel="" className="spec-block callout-red">
          <h2>Blockers</h2>
          {loop.blockers.length === 0 ? (
            <p>Nothing is stopping this loop.</p>
          ) : (
            loop.blockers.map((blocker) => (
              <article key={`${blocker.title}-${blocker.runN}`} data-blocker="" className="blocker">
                <h3>{blocker.title}</h3>
                <p>{blocker.detail}</p>
                <p className="section-note">
                  {blocker.runN != null ? `From run #${blocker.runN}` : "From run no data"} · {blocker.when}
                </p>
                <button type="button" data-testid="blocker-fix" className="btn">
                  {blocker.fix}
                </button>
              </article>
            ))
          )}
        </section>
        <section id="needs-input" data-testid="panel-needs-input" data-panel="" className="spec-block callout-amber">
          <h2>Needs your input {loop.suggestions.length > 0 ? `${loop.suggestions.length} suggestions` : ""}</h2>
          {anyApproved ? <p className="approved">Approved · applies at the next sync (≤10 min)</p> : null}
          {loop.suggestions.length === 0 ? <p>Nothing is waiting on you.</p> : null}
          {loop.suggestions.map((suggestion, index) => {
            if (dismissed[suggestion.id]) return null;
            const hidden = index >= shown;
            return (
              <article key={suggestion.id} data-suggestion="" className="suggestion" hidden={hidden}>
                <h3>{suggestion.title}</h3>
                {editing === suggestion.id ? (
                  <textarea
                    value={drafts[suggestion.id] ?? suggestion.detail}
                    onChange={(event) => setDrafts((current) => ({ ...current, [suggestion.id]: event.target.value }))}
                  />
                ) : (
                  <p>{drafts[suggestion.id] ?? suggestion.detail}</p>
                )}
                <div className="card-actions">
                  {approved[suggestion.id] ? null : (
                    <button
                      type="button"
                      data-testid="btn-approve"
                      className="btn btn-primary"
                      onClick={() => setApproved((current) => ({ ...current, [suggestion.id]: true }))}
                    >
                      Approve
                    </button>
                  )}
                  {suggestion.canEdit ? (
                    <button type="button" data-testid="btn-edit" className="btn" onClick={() => setEditing(suggestion.id)}>
                      Edit
                    </button>
                  ) : null}
                  {approved[suggestion.id] ? null : (
                    <button
                      type="button"
                      data-testid="btn-dismiss"
                      className="btn"
                      onClick={() => setDismissed((current) => ({ ...current, [suggestion.id]: true }))}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </article>
            );
          })}
          {shown < loop.suggestions.length ? (
            <button type="button" className="text-btn" onClick={() => setShown(loop.suggestions.length)}>
              Show {loop.suggestions.length - shown} more suggestion{loop.suggestions.length - shown === 1 ? "" : "s"}
            </button>
          ) : null}
        </section>
      </div>

      <div className="tabs" role="tablist" aria-label="Loop sections">
        {tabs.map((name) => (
          <button key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
      </div>
      <div role="tabpanel" hidden={tab !== "Progress log"}>
        {pageRuns.length === 0 ? (
          <p className="empty">No runs yet</p>
        ) : (
          <div className="timeline">
            {pageRuns.map((run) => {
              const tone = run.status === "failed" ? "bad" : run.status === "reverted" || (run.score_delta != null && run.score_delta < 0) ? "warn" : "ok";
              return (
                <div key={run.n} className="timeline-item">
                  <span className={`timeline-dot tone-${tone}`} aria-hidden="true" />
                  <RunPost run={run} loopId={loop.id} />
                </div>
              );
            })}
          </div>
        )}
        <div className="pager">
          {page > 0 ? (
            <button type="button" className="btn" onClick={() => setPage((value) => value - 1)}>
              Newer runs
            </button>
          ) : null}
          {(page + 1) * 20 < ordered.length ? (
            <button type="button" className="btn" onClick={() => setPage((value) => value + 1)}>
              Older runs
            </button>
          ) : null}
        </div>
      </div>
      <div role="tabpanel" hidden={tab !== "Spec"}>
        <SpecPanel loop={loop} />
      </div>
      <div role="tabpanel" hidden={tab !== "Goals & evals"}>
        <GoalsPanel loop={loop} />
      </div>
      <div role="tabpanel" hidden={tab !== "Guardrails"}>
        <section data-panel="" className="spec-block">
          <h2>Guardrails</h2>
          <ul>
            {loop.guardrails.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
      <div role="tabpanel" hidden={tab !== "Schedule"}>
        <section data-panel="" className="spec-block">
          <h2>Schedule</h2>
          <dl className="kv">
            <div>
              <dt>Schedule</dt>
              <dd>{scheduleLine(loop.scheduleWords)}</dd>
            </div>
            <div>
              <dt>Cron</dt>
              <dd>{loop.scheduleCron}</dd>
            </div>
            <div>
              <dt>Timezone</dt>
              <dd>{loop.timezone}</dd>
            </div>
            <div>
              <dt>Next run</dt>
              <dd>{loop.nextRunLabel}</dd>
            </div>
            <div>
              <dt>Time limit</dt>
              <dd>{loop.spec.runtime.timeLimit}</dd>
            </div>
            <div>
              <dt>Budget</dt>
              <dd>{loop.spec.runtime.budget}</dd>
            </div>
          </dl>
        </section>
      </div>

      {drawer ? (
        <Drawer testId={drawer === "spec" ? "drawer-spec" : "drawer-goals"} title={loop.name} onClose={() => setDrawer(null)}>
          {drawer === "spec" ? <SpecPanel loop={loop} /> : <GoalsPanel loop={loop} />}
        </Drawer>
      ) : null}
    </div>
  );
}
