import Link from "next/link";
import type { Dataset } from "@/lib/types";
import { ProductVisuals } from "./ProductVisuals";

const specSample = `---
name: Weekly site audit
status: active
schedule: weekly, Monday 9 AM PT
---

## Objective
Find broken links and missing alt text.

## Evals
Score 0 to 100: issues found that a person
confirms, minus false alarms.

## Sources and instructions
Crawl the sitemap. Check each page.

## Quality control
Check findings against current WCAG
guidance before reporting them.

## Macros and recursion
For each page: crawl, check, report.

## Learning
Log which checks caught real issues.

## Schedule
Mondays. Stop if the site is down.

## Roadmap
Next: check page load time.

## OKRs
Score 85 or more for 4 weeks in a row.`;

const parts = [
  ["Objective", "One goal in one line. If it needs a paragraph, split the loop."],
  ["Evals", "How each run is scored, as a number you can chart."],
  ["Sources and instructions", "What the loop reads and the steps it follows."],
  ["Quality control", "Checks against outside standards, such as current accessibility guidance."],
  ["Macros and recursion", "Steps the loop repeats, and other loops it can call."],
  ["Learning", "Notes on what raised or lowered the score. The next run reads them first."],
  ["Schedule", "When it runs, and when it stops early."],
  ["Roadmap", "What the loop works on next."],
  ["OKRs", "The targets the scores roll up to."],
];

export function HomeMain({ data }: { data: Dataset }) {
  return (
    <main className="home" id="main">
      <p data-testid="sample-label" className="sample-label">
        Sample data
      </p>
      <section className="hero" aria-labelledby="hero-title">
        <p className="status-line">In development. I built it to run my own loops.</p>
        <h1 id="hero-title" className="hero-title">
          See which of your AI agent loops are getting better
        </h1>
        <p className="lede">
          Looper keeps each recurring agent job in one Markdown spec. Every run gets a score. The loop logs what raised
          the score and edits its own instructions, inside limits you write down.
        </p>
        <div className="card-actions">
          <Link className="btn btn-primary" href="/spec">
            Read the spec
          </Link>
        </div>
      </section>

      <section className="block" id="bank" aria-labelledby="bank-title" data-panel="">
        <h2 id="bank-title">Every loop on one screen</h2>
        <p className="lede">
          The bank lists your loops. Each row shows when the loop runs, its last score and the change since the run
          before. <strong>The rows below are example data.</strong>
        </p>
        <ProductVisuals loops={data.loops} runsToday={data.summary.runsToday} costWeek={data.summary.costWeek} />
        <p className="section-note">The bank view with example data. Looper is in development.</p>
      </section>

      <section className="block" id="anatomy" aria-labelledby="anatomy-title" data-panel="">
        <h2 id="anatomy-title">Each loop is one Markdown file</h2>
        <p className="lede">
          The spec says what the loop is for, how each run is scored and what the loop may change on its own. Open it in
          any text editor.
        </p>
        <div className="anatomy">
          <pre className="spec-code" tabIndex={0} aria-label="Short example of a loop spec file">
            <code>{specSample}</code>
          </pre>
          <ol className="parts">
            {parts.map(([title, body], index) => (
              <li key={title}>
                <span className="part-n" aria-hidden="true">
                  {index + 1}
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <p className="lede">
          Every field and rule is in the <Link href="/spec">spec format docs</Link>.
        </p>
      </section>

      <section className="block" id="how" aria-labelledby="how-title" data-panel="">
        <h2 id="how-title">What happens on each run</h2>
        <p className="lede">Each run has four steps. The loop can only edit the sections its spec lets it edit.</p>
        <ol className="cycle">
          <li data-panel="">
            <span className="part-n">Step 1</span>
            <h3>Run</h3>
            <p>The loop does its job on schedule, following its spec.</p>
          </li>
          <li data-panel="">
            <span className="part-n">Step 2</span>
            <h3>Eval</h3>
            <p>It scores the result against the evals in the spec.</p>
          </li>
          <li data-panel="">
            <span className="part-n">Step 3</span>
            <h3>Learn</h3>
            <p>It notes what raised or lowered the score.</p>
          </li>
          <li data-panel="">
            <span className="part-n">Step 4</span>
            <h3>Rewrite the spec</h3>
            <p>It updates its instructions and bumps the spec version.</p>
          </li>
        </ol>
        <p className="lede">Every edit is logged with the reason. If the next score drops, the loop goes back to the last version.</p>
      </section>

      <section className="block" id="who" aria-labelledby="who-title" data-panel="">
        <h2 id="who-title">Who it is for</h2>
        <p className="lede">You run several recurring AI agent jobs and want to know whether each one is working.</p>
        <div className="grid2">
          <div data-panel="" className="feature">
            <h3>A good fit if you</h3>
            <ul>
              <li>Run nightly or weekly agent jobs on code, docs or reports.</li>
              <li>Want each job&apos;s instructions in a file you can read and edit.</li>
              <li>Want a score for every run, so you can tell if a change helped.</li>
            </ul>
          </div>
          <div data-panel="" className="feature">
            <h3>Not a fit if you</h3>
            <ul>
              <li>Need a hosted product you can sign up for. There isn&apos;t one yet.</li>
              <li>Want a drag and drop workflow builder.</li>
              <li>Run one or two jobs. A cron job is enough for that.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="block" id="origin" aria-labelledby="origin-title" data-panel="">
        <h2 id="origin-title">Why I built it</h2>
        <p>
          I run recurring agent jobs every day on my own sites and projects. Each job kept its instructions in a
          different place. When a run taught me something, the lesson stayed in a chat log and the next run never saw
          it.
        </p>
        <p>So I started writing each job as a spec with a score and a log. Looper holds those specs, runs them and shows me the scores.</p>
        <p>I write the specs and decide what ships. AI agents write much of the code and the first drafts, and I review them.</p>
      </section>

      <section className="block" id="faq" aria-labelledby="faq-title" data-panel="">
        <h2 id="faq-title">Questions</h2>
        <dl className="faq">
          <dt>Can I use Looper today?</dt>
          <dd>No. It runs only my own loops for now. There is no sign-up.</dd>
          <dt>What does it cost?</dt>
          <dd>Nothing. It is not for sale.</dd>
          <dt>Can I use the spec format without Looper?</dt>
          <dd>Yes. A spec is a Markdown file. The format is documented, so you can write your own.</dd>
          <dt>Will a loop change things without asking?</dt>
          <dd>Only the sections its spec allows. Changes to money, logins, data or design wait for the owner.</dd>
        </dl>
      </section>

      <section className="block" id="next" aria-labelledby="next-title" data-panel="">
        <h2 id="next-title">Write your first loop spec</h2>
        <p className="lede">
          The spec page has the file skeleton, every field and a full example. Copy it and fill in one job you already
          run.
        </p>
        <div className="card-actions">
          <Link className="btn btn-primary" href="/spec">
            Read the spec
          </Link>
        </div>
      </section>
    </main>
  );
}
