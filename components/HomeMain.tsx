/* eslint-disable @next/next/no-img-element */
// Screenshots are static files in public/screenshots, shown at their own size.

export const GITHUB_URL = "https://github.com/Verafyai/looper";

export const screenshots = [
  { file: "dashboard.png", width: 1440, height: 900, alt: "Looper dashboard: summary tiles and every loop with its health, score, schedule and cost", caption: "Dashboard" },
  { file: "loop.png", width: 1440, height: 900, alt: "A loop page: score chart against its target, blockers, and the progress log of each run", caption: "Loop and score" },
  { file: "spec-goals.png", width: 1440, height: 900, alt: "A loop's spec and goals: objective, KPIs, OKRs and the steps the loop follows", caption: "Spec and goals" },
  { file: "one-offs.png", width: 1440, height: 900, alt: "One-offs: reminders that are not loops, with due dates and status", caption: "One-offs" },
  { file: "dashboard-mobile.png", width: 375, height: 812, alt: "The dashboard on a phone", caption: "Dashboard on a phone" },
  { file: "loop-mobile.png", width: 375, height: 812, alt: "A loop page on a phone", caption: "Loop on a phone" },
] as const;

export function HomeMain() {
  return (
    <main className="home" id="main">
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title" className="hero-title">
          Manage your agentic processes and workflows, on a schedule, in one dashboard
        </h1>
        <p className="lede hero-lede">
          Set up and see your looping, scheduled processes, the steps that power each one, and the KPIs that move it
          toward its objectives.
        </p>
        <div className="card-actions">
          <a className="btn btn-primary" href={GITHUB_URL}>
            View on GitHub
          </a>
        </div>
      </section>

      <section className="shots" aria-label="Screenshots">
        <ul className="shot-strip" tabIndex={0} aria-label="Looper screenshots, scroll sideways for more">
          {screenshots.map((shot) => (
            <li key={shot.file} className={shot.width < 768 ? "shot shot-phone" : "shot"}>
              <img
                src={`/screenshots/${shot.file}`}
                alt={shot.alt}
                width={shot.width}
                height={shot.height}
                loading="lazy"
                decoding="async"
              />
              <span className="shot-caption">{shot.caption}</span>
            </li>
          ))}
        </ul>
        <p data-testid="sample-label" className="section-note">
          Screenshots show sample data.
        </p>
      </section>
    </main>
  );
}
