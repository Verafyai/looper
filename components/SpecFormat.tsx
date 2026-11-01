import Link from "next/link";

const sectionNames = [
  "Objective",
  "Evals",
  "Sources and instructions",
  "Quality control",
  "Macros and recursion",
  "Learning",
  "Schedule",
  "Roadmap",
  "OKRs",
];

const frontMatter = `id: nightly-fix-loop
name: Nightly fix loop
status: active
schedule: "0 23 * * *"
timezone: America/Los_Angeles
owner: the owner
version: 1
max_items: 3
stop_when:
  - a live site is down before the run starts
  - two items fail on the same product
needs_owner:
  - copy, brand and visual design
  - pricing, payments and credits
  - logins and sessions
  - database schema, migrations, deleting content
  - API keys and secrets
  - major package upgrades
evals: [copy-eval, quality-eval]
log: runs/nightly-fix/`;

const exampleSections: Array<[string, string[]]> = [
  ["Objective", ["Ship up to 3 small, low risk fixes per product each night.", "Each fix must pass its check on the live site."]],
  [
    "Evals",
    [
      "Build and tests pass in every PR, with the output pasted in.",
      "The fix passes its own acceptance check on the live URL.",
      "Screenshots at 1440 and 375 wide look right.",
      "Weekly: copy eval and quality eval, each scored 0 to 100.",
    ],
  ],
  [
    "Sources and instructions",
    [
      "Read the product file for each product in the inventory.",
      "Take the top backlog items that are low or medium risk and do not need the owner. At most 3 per product.",
      "One item, one pull request. Small diffs. Never bundle.",
      "Run the build and tests. No passing output, no merge.",
      "Merge, deploy, then run the acceptance check live.",
      "Tick the item done (PR number, date) or mark it blocked.",
    ],
  ],
  [
    "Quality control",
    [
      "Follow the design guardrails file for every visual change.",
      "Check copy changes against the copy eval rules, which come from published landing page guidance.",
    ],
  ],
  [
    "Macros and recursion",
    ["per_product: pick items, open PR, gate, merge, verify.", "On failure: revert, log, mark blocked. Do not retry tonight."],
  ],
  ["Learning", ["After each run, append to the log: what shipped, what failed, and why. Items that fail twice go to the owner list."]],
  ["Schedule", ["Nightly at 11 PM Pacific. A morning report loop reads the log."]],
  ["Roadmap", ["Add a minimal CI check to each repo (needs owner).", "Add tests where a repo has none."]],
  [
    "OKRs",
    [
      "O1: Every product page passes the copy and quality evals.",
      "KR1: Every page scores 85 or more on the copy eval.",
      "KR2: Every page scores 85 or more on the quality eval.",
      "KR3: No failed fix stays live past the morning report.",
    ],
  ],
];

const fields: Array<[string, string, string]> = [
  ["id", "Yes", "Short, stable slug. Never changes, even when the name does."],
  ["name", "Yes", "Human name shown in the bank."],
  ["status", "Yes", "One of draft, active, paused, retired."],
  ["schedule", "Yes", "Cron line, or manual."],
  ["timezone", "No", "IANA zone for the schedule, such as America/Los_Angeles."],
  ["owner", "No", "Who approves changes the loop cannot make alone."],
  ["version", "No", "Spec version. The loop bumps it each time it rewrites itself."],
  ["max_items", "No", "Most work items the loop may take per run."],
  ["stop_when", "No", "Conditions that end a run early."],
  ["needs_owner", "No", "Kinds of change that always wait for the owner."],
  ["evals", "No", "Paths or names of the eval sets this loop scores against."],
  ["log", "No", "Where the loop writes its run log and learning notes."],
];

export function SpecFormat() {
  return (
    <main className="home" id="main">
      <article className="doc" data-panel="">
        <p className="page-kicker">Draft 0.1, October 31, 2026</p>
        <h1 className="hero-title">The loop spec format</h1>
        <p className="lede">
          Each loop is one Markdown file. The YAML front matter holds what the scheduler needs. Nine sections below it
          hold the instructions the agent follows.
        </p>
        <p className="section-note">Draft. I use this format for my own loops. Field names may change before 1.0.</p>
        <ul className="toc" aria-label="On this page">
          <li>
            <a href="#file">The file</a>
          </li>
          <li>
            <a href="#fields">Front matter fields</a>
          </li>
          <li>
            <a href="#sections">The nine sections</a>
          </li>
          <li>
            <a href="#rules">Rules for self-rewrites</a>
          </li>
          <li>
            <a href="#example">Example: nightly fix loop</a>
          </li>
        </ul>

        <h2 id="file">The file</h2>
        <p>
          Name the file after the loop, such as <code>weekly-site-audit.loop.md</code>. One loop per file. Keep the
          files in one folder. That folder is your bank.
        </p>
        <div className="file-skeleton" aria-label="Shape of a loop spec file">
          <p className="part-n">Front matter fields</p>
          <ol className="steps">
            {sectionNames.map((name) => (
              <li key={name} className="step-chip">
                {name}
              </li>
            ))}
          </ol>
        </div>

        <h2 id="fields">Front matter fields</h2>
        <p>The first 4 fields are required. The rest are optional.</p>
        <table className="doc-table">
          <thead>
            <tr>
              <th scope="col">Field</th>
              <th scope="col">Required</th>
              <th scope="col">What it holds</th>
            </tr>
          </thead>
          <tbody>
            {fields.map(([field, required, detail]) => (
              <tr key={field}>
                <td>
                  <code>{field}</code>
                </td>
                <td>{required}</td>
                <td>{detail}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 id="sections">The nine sections</h2>
        <h3>Objective</h3>
        <p>One or two lines on what a good run changes. If it needs a paragraph, split the loop.</p>
        <h3>Evals</h3>
        <p>How each run is scored, and on what scale. Use a number you can chart. Mark which checks are scripted and which a judge scores.</p>
        <h3>Sources and instructions</h3>
        <p>What the loop reads, such as files, sites or inboxes, and the steps it follows in order.</p>
        <h3>Quality control</h3>
        <p>Checks against outside standards. For example: find current guidance on landing page copy and check each change against it.</p>
        <h3>Macros and recursion</h3>
        <p>Named steps the loop repeats, and other loops it may call. Say how deep it may go.</p>
        <h3>Learning</h3>
        <p>Where the loop records what raised or lowered its score. The next run reads these notes before it starts.</p>
        <h3>Schedule</h3>
        <p>When it runs, in plain words. Add stop rules and what to do when a run fails.</p>
        <h3>Roadmap</h3>
        <p>What the loop works on next, in order. The loop may reorder the list. Only the owner adds large items.</p>
        <h3>OKRs</h3>
        <p>The objectives and key results the scores roll up to. Keep it to 1 to 3 key results.</p>

        <h2 id="rules">Rules for self-rewrites</h2>
        <ul>
          <li>A loop may edit its own Sources, Macros, Learning and Roadmap sections after a scored run.</li>
          <li>It may not edit its Objective, Evals, OKRs or needs_owner list. Those belong to the owner.</li>
          <li>Every rewrite bumps version and adds a line to the learning log saying why.</li>
          <li>If a rewrite lowers the score on the next run, the loop rolls back to the last version.</li>
        </ul>

        <h2 id="example">Example: nightly fix loop</h2>
        <p>
          This is a trimmed copy of a loop I run each night to fix small issues on my sites. Product names, repo names
          and private details are removed.
        </p>
        <div className="example-file">
          <h3>Front matter fields</h3>
          <pre className="spec-code" tabIndex={0}>
            <code>{frontMatter}</code>
          </pre>
          {exampleSections.map(([title, lines]) => (
            <section key={title}>
              <h3>{title}</h3>
              <ul>
                {lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p>To try it, copy the skeleton into a file and fill it in for one job you already run. Run it by hand once before you put it on a schedule.</p>
        <p>
          <Link className="btn btn-primary" href="/#bank">
            See the bank view
          </Link>
        </p>
      </article>
    </main>
  );
}
