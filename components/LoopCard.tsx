import Link from "next/link";
import type { LoopRecord } from "@/lib/types";
import { cardStatusOf } from "@/lib/status";
import { Sparkline } from "./Sparkline";

function scoreText(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

export function LoopCard({
  loop,
  hidden,
  onSpec,
  onGoals,
}: {
  loop: LoopRecord;
  hidden: boolean;
  onSpec: (id: string) => void;
  onGoals: (id: string) => void;
}) {
  const status = cardStatusOf(loop);
  const deltaClass =
    loop.delta14d == null ? "delta-flat" : loop.delta14d > 0 ? "delta-up" : loop.delta14d < 0 ? "delta-down" : "delta-flat";

  return (
    <article data-loop-card={loop.id} data-status={status} data-panel="" className="loop-card" hidden={hidden}>
      <div className="card-top">
        <span className={`status-dot ${status}`} aria-hidden="true" />
        <Link href={`/looper/${loop.id}`} data-testid="card-name" className="card-name">
          {loop.name}
        </Link>
      </div>
      {loop.flags.length > 0 ? (
        <div className="flags">
          {loop.flags.map((flag) => (
            <Link
              key={flag.kind}
              data-testid="card-flag"
              data-kind={flag.kind}
              className="flag"
              href={flag.kind === "blocker" ? `/looper/${loop.id}#blockers` : `/looper/${loop.id}#needs-input`}
            >
              {flag.text}
            </Link>
          ))}
        </div>
      ) : null}
      {loop.scoreState === "scored" && loop.score != null ? (
        <div className="score-row">
          <div>
            <div data-testid="card-score" className="card-score">
              {scoreText(loop.score)}
            </div>
            <div data-testid="card-target" className="card-target">
              score · target {loop.target}
            </div>
            <div data-testid="card-delta" className={deltaClass}>
              {loop.delta14dLabel}
            </div>
          </div>
          <Sparkline values={loop.sparkline} target={loop.target} />
        </div>
      ) : loop.scoreState === "no-data" ? (
        <div data-testid="card-score" className="card-score">
          no data
        </div>
      ) : (
        <div data-testid="card-noscore" className="noscore">
          No score yet. <strong>Define goals and KPIs</strong> to start tracking progress.
        </div>
      )}
      {loop.kpiChips.length > 0 ? (
        <div className="chips">
          {loop.kpiChips.slice(0, 3).map((chip) => (
            <span key={chip.label} data-kpi-chip="" className="chip">
              {chip.label} {chip.value}
            </span>
          ))}
        </div>
      ) : null}
      <dl className="meta">
        <div>
          <dt>Schedule</dt>
          <dd data-testid="meta-schedule">{loop.scheduleWords}</dd>
        </div>
        <div>
          <dt>Next run</dt>
          <dd data-testid="meta-next-run">{loop.nextRunLabel}</dd>
        </div>
        <div>
          <dt>Runs</dt>
          <dd data-testid="meta-runs">{loop.runsMeta}</dd>
        </div>
        <div>
          <dt>Cost</dt>
          <dd data-testid="meta-cost">{loop.costMeta}</dd>
        </div>
      </dl>
      <div className="card-actions">
        <button type="button" data-testid="btn-spec" className="btn" onClick={() => onSpec(loop.id)}>
          Spec
        </button>
        <button type="button" data-testid="btn-goals" className="btn" onClick={() => onGoals(loop.id)}>
          Goals & evals
        </button>
        <Link data-testid="btn-log" className="btn btn-primary" href={`/looper/${loop.id}`}>
          Progress log →
        </Link>
      </div>
    </article>
  );
}
