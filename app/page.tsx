import { SiteHeader } from "@/components/SiteHeader";
import { dataMode } from "@/lib/adapter";

function SampleLabel() {
  return (
    <p data-testid="sample-label" className="sample-label">
      Sample data
    </p>
  );
}

export default function HomePage() {
  const sample = dataMode() === "sample";
  return (
    <>
      <SiteHeader />
      <main className="home">
        {sample ? <SampleLabel /> : null}
        <p className="page-kicker">LOOPER BY DEVRADAR</p>
        <h1 className="page-title">Every loop, at a glance.</h1>
        <p className="lede">
          Looper tracks each running agent loop: health, score, schedule, cost, goals and the log of every run.
        </p>
        <div className="visual-grid">
          <article data-product-visual="dashboard" data-panel="" className="visual">
            {sample ? <SampleLabel /> : null}
            <h2>Dashboard</h2>
            <p>Six tiles show what is blocked, what needs input, and whether the average score is moving.</p>
            <div className="mini-row">
              <span className="chip">Loops 19</span>
              <span className="chip">Blocked 1</span>
              <span className="chip">Score 81.6</span>
            </div>
          </article>
          <article data-product-visual="loop" data-panel="" className="visual">
            {sample ? <SampleLabel /> : null}
            <h2>Loop</h2>
            <p className="mini-score">84.9</p>
            <p>A score, a target, and a run log you can share one post at a time.</p>
          </article>
          <article data-product-visual="specgoals" data-panel="" className="visual">
            {sample ? <SampleLabel /> : null}
            <h2>Spec and goals</h2>
            <p>Purpose, steps, KPIs and guardrails render as sections, never as a raw file.</p>
          </article>
        </div>
        <div className="feature-grid">
          <section data-panel="" className="feature">
            <h2>Glanceable</h2>
            <p>Blocked loops come first. Everything else can wait until you ask for it.</p>
          </section>
          <section data-panel="" className="feature">
            <h2>Measured</h2>
            <p>A loop with goals gets a score from 0 to 100. A loop without goals asks you to define them.</p>
          </section>
          <section data-panel="" className="feature">
            <h2>Honest</h2>
            <p>Missing numbers stay missing. The footer names the snapshot the status came from.</p>
          </section>
        </div>
      </main>
    </>
  );
}
