import { SiteHeader } from "@/components/SiteHeader";
import { dataMode } from "@/lib/adapter";

export default function PublicSpecPage() {
  const sample = dataMode() === "sample";
  return (
    <>
      <SiteHeader />
      <main className="home">
        {sample ? (
          <p data-testid="sample-label" className="sample-label">
            Sample data
          </p>
        ) : null}
        <p className="page-kicker">LOOPER</p>
        <h1 className="page-title">Product spec</h1>
        <section data-panel="" className="spec-block">
          <h2>Look and feel</h2>
          <p>
            The app sits on a near-black background with translucent panels, a green accent, and the Inter typeface.
            Body text stays at 15 to 16px. Nothing on screen is smaller than 13px. A slow orbit graphic sits behind the
            first screen and stops when the reader asks for reduced motion.
          </p>
          <h2>Dashboard</h2>
          <p>
            The dashboard opens with six summary tiles: how many loops are running, how many are blocked, how many need
            input, the average score, runs today, and cost this week. Filter pills and a search box narrow the list.
            Needs attention comes before running loops. Paused loops stay collapsed until you ask to see them.
          </p>
          <h3>Loop cards</h3>
          <p>
            Each card shows the name, any blocker or input flag, the score and target, a sparkline, up to three KPI
            chips, the schedule, the next run, the run count, and the cost. Spec and Goals open a side panel. Progress
            log opens the loop.
          </p>
          <h2>Loop page</h2>
          <p>
            A loop page has a stats row, a score chart, progress toward each goal, a blockers panel, and a needs-input
            panel. The progress log is a post per run, newest first, 20 posts per page. Each post has its own address.
          </p>
          <h3>Spec and goals</h3>
          <p>
            Spec and Goals render as structured sections: purpose, scope, steps, inputs, runtime, a goals table, evals,
            guardrails, and quality control. The page does not dump the source file onto the screen.
          </p>
          <h2>Measurement</h2>
          <p>
            The score is a weighted average of KPIs normalized from 0 to 100 against their targets. A loop with no
            goals has no score and raises a needs-input flag. A loop is blocked when the latest run failed, a
            dependency check failed, or two runs in a row failed. Cost and duration come from recorded runs once a loop
            has at least three of them.
          </p>
        </section>
      </main>
    </>
  );
}
