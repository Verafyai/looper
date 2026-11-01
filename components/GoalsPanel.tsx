import type { LoopRecord } from "@/lib/types";

export function GoalsPanel({ loop }: { loop: LoopRecord }) {
  return (
    <section data-panel className="spec-block">
      <header className="spec-header">
        <h2>Goals & evals</h2>
        <p>What the loop is trying to achieve, how each run is scored, and the guardrails it must pass.</p>
      </header>
      {loop.goalRows.length === 0 ? (
        <p>no data</p>
      ) : (
        <table data-testid="goals-table" className="goals-table">
          <thead>
            <tr>
              <th>Goal</th>
              <th>KPI</th>
              <th>Now</th>
              <th>Target</th>
              <th>Last run</th>
            </tr>
          </thead>
          <tbody>
            {loop.goalRows.map((row) => (
              <tr key={row.kpi}>
                <td>{row.goal}</td>
                <td>{row.kpi}</td>
                <td>{row.now}</td>
                <td>{row.target}</td>
                <td>
                  <span className={`pill-mini tone-${row.tone}`}>{row.lastRun}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div data-goals-section="evals">
        <h3>Evals run on every change</h3>
        <ul>
          {loop.evals.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div data-goals-section="guardrails">
        <h3>Guardrails</h3>
        <ul>
          {loop.guardrails.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div data-goals-section="qc">
        <h3>Quality control</h3>
        {loop.qc.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </section>
  );
}
