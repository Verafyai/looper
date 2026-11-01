import type { LoopRecord } from "@/lib/types";

export function SpecPanel({ loop }: { loop: LoopRecord }) {
  const { spec } = loop;
  return (
    <section data-panel className="spec-block">
      <header data-testid="spec-header" className="spec-header">
        <h2>Spec</h2>
        <p>
          The readable specification for this loop. Version {spec.version} · edited {spec.editedLabel}
          {spec.reconstructed ? (
            <>
              {" "}
              · <span className="reconstructed">reconstructed from the routine</span>
            </>
          ) : null}
        </p>
      </header>
      <div data-spec-section="purpose">
        <h3>Purpose</h3>
        <p>{spec.purpose}</p>
      </div>
      <div data-spec-section="scope">
        <h3>Scope</h3>
        <dl className="kv">
          <div>
            <dt>Products</dt>
            <dd>{spec.scope.products}</dd>
          </div>
          <div>
            <dt>Allowed changes</dt>
            <dd>{spec.scope.allowed}</dd>
          </div>
          <div>
            <dt>Not allowed</dt>
            <dd>{spec.scope.notAllowed}</dd>
          </div>
        </dl>
      </div>
      <div data-spec-section="steps">
        <h3>Steps</h3>
        {spec.steps.length === 0 ? (
          <p>no data</p>
        ) : (
          <ol className="steps">
            {spec.steps.map((step, index) => (
              <li key={step} className="step-item">
                {index > 0 ? (
                  <span className="step-arrow" aria-hidden="true">
                    →
                  </span>
                ) : null}
                <span data-step-chip="" className="step-chip">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div data-spec-section="inputs">
        <h3>Inputs and tools</h3>
        {spec.inputs.length === 0 ? (
          <p>no data</p>
        ) : (
          <ul>
            {spec.inputs.map((input) => (
              <li key={input}>{input}</li>
            ))}
          </ul>
        )}
      </div>
      <div data-spec-section="runtime">
        <h3>Runtime</h3>
        <dl className="kv">
          <div>
            <dt>Schedule</dt>
            <dd>{spec.runtime.schedule}</dd>
          </div>
          <div>
            <dt>Time limit</dt>
            <dd>{spec.runtime.timeLimit}</dd>
          </div>
          <div>
            <dt>Budget</dt>
            <dd>{spec.runtime.budget}</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>{spec.runtime.model}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
