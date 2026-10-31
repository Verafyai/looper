import { formatRunMeta, formatScoreDelta } from "@/lib/format";
import type { RunRecord } from "@/lib/types";

function scoreText(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

export function RunPost({ run, loopId }: { run: RunRecord; loopId: string }) {
  const delta = run.score_delta;
  const tone = delta == null || delta === 0 ? "flat" : delta > 0 ? "up" : "down";
  return (
    <article data-run-post={run.n} data-run-status={run.status} id={`run-${run.n}`} data-panel="" className="run-post">
      <div className="run-top">
        <p data-testid="run-meta">{formatRunMeta(run)}</p>
        {run.score != null ? (
          <p className={`delta-${tone}`}>
            Score {scoreText(run.score)} ({formatScoreDelta(delta)})
          </p>
        ) : (
          <p className="delta-flat">No score</p>
        )}
      </div>
      <h3 data-testid="run-headline" className="run-headline">
        {run.post.headline}
      </h3>
      <p data-testid="run-summary">{run.post.summary}</p>
      <div className="run-cols">
        <div data-testid="run-changed">
          <h4>Changed</h4>
          {run.post.changed.length === 0 ? (
            <p>no data</p>
          ) : (
            <ul>
              {run.post.changed.map((change) => (
                <li key={change.text}>
                  <a href={change.url}>{change.text}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div data-testid="run-evals">
          <h4>Evals</h4>
          {run.post.evals.length === 0 ? (
            <p>no data</p>
          ) : (
            <ul>
              {run.post.evals.map((item) => (
                <li key={item.text}>{item.text}</li>
              ))}
            </ul>
          )}
        </div>
        <div data-testid="run-suggested">
          <h4>Suggested / wanted</h4>
          {run.post.suggested.length === 0 ? (
            <p>no data</p>
          ) : (
            <ul>
              {run.post.suggested.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <a data-testid="run-permalink" href={`/looper/${loopId}/runs/${run.n}`}>
        Permalink
      </a>
    </article>
  );
}
