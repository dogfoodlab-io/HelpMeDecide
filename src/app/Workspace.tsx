import type { Decision, Dossier, FrameworkRun } from "../domain/types";

interface WorkspaceProps {
  decision: Decision;
  frameworkRun: FrameworkRun | null;
  dossier: Dossier | null;
}

export function Workspace({ decision, frameworkRun, dossier }: WorkspaceProps) {
  return (
    <section className="workspace">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>{decision.map.goal}</h2>
        </div>
        <div className="status-pill">
          Confidence {Math.round(decision.map.confidence * 100)}%
        </div>
      </header>

      <section className="panel">
        <h3>Decision Map</h3>
        <div className="map-grid">
          <MapList title="Options" items={decision.map.options.map((option) => option.label)} />
          <MapList title="Criteria" items={decision.map.criteria.map((criterion) => criterion.label)} />
          <MapList title="Constraints" items={decision.map.constraints} />
          <MapList title="Open questions" items={decision.map.openQuestions} />
        </div>
      </section>

      <section className="lane-grid" aria-label="Input lanes">
        {["Opinions", "Data", "AI Thinking", "Context"].map((lane) => (
          <article className="lane" key={lane}>
            <h3>{lane}</h3>
            <p>
              {lane === "Data"
                ? "Research summaries use citations and could-not-verify states."
                : "Structured inputs update the decision map."}
            </p>
          </article>
        ))}
      </section>

      <section className="panel">
        <h3>Recommended workflow</h3>
        <p>{frameworkRun?.recommendation.reason}</p>
      </section>

      <section className="panel">
        <h3>Decision Dossier</h3>
        <p>
          {dossier
            ? dossier.recommendedOption
            : "Run a workflow to generate the recommendation, rationale, uncertainty, dissent, and next steps."}
        </p>
      </section>
    </section>
  );
}

function MapList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4>{title}</h4>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">Needs input</p>
      )}
    </div>
  );
}
