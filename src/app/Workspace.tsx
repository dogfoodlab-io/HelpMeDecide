import { useState } from "react";
import { A2uiPairwiseChoice } from "./A2uiPairwiseChoice";
import { applyPairwiseObservation, type PairwiseChoice, type PurchaseDecisionModel } from "../domain/purchaseDecision";
import type { Decision, Dossier, FrameworkRun } from "../domain/types";

interface WorkspaceProps {
  decision: Decision;
  frameworkRun: FrameworkRun | null;
  dossier: Dossier | null;
}

export function Workspace({ decision, frameworkRun, dossier }: WorkspaceProps) {
  const [purchaseModel, setPurchaseModel] = useState<PurchaseDecisionModel>(() => ({
    revision: 0,
    goal: decision.map.goal,
    useCases: [],
    constraints: decision.map.constraints.map((label, index) => ({ id: `constraint-${index}`, label, required: true, provenance: "inferred" })),
    candidates: decision.map.options.map((option) => ({ id: option.id, label: option.label, attributes: {}, provisional: false })),
    preferences: [],
  }));
  const [pairwiseChoice, setPairwiseChoice] = useState<PairwiseChoice | null>(null);
  const [saveState, setSaveState] = useState("Local draft");
  const [candidateRank, setCandidateRank] = useState<string[]>([]);
  const [scenarioPrice, setScenarioPrice] = useState(0);
  const [briefOutcome, setBriefOutcome] = useState("investigate-further");
  const left = purchaseModel.candidates[0];
  const right = purchaseModel.candidates[1];
  const commitPairwise = () => {
    if (!left || !right || !pairwiseChoice) return;
    try {
      setPurchaseModel((current) => applyPairwiseObservation(current, {
        actionId: crypto.randomUUID(), expectedRevision: current.revision,
        leftId: left.id, rightId: right.id, choice: pairwiseChoice,
      }));
      setSaveState("Saved locally; account sync is not configured");
    } catch { setSaveState("Refresh this exercise to submit your answer."); }
  };
  return (
    <section className="workspace">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">Purchase decision</p>
          <h2>{decision.map.goal}</h2>
        </div>
        <div className="status-pill">
          Facts: unknown · Preferences: learning · Fit: provisional
        </div>
      </header>

      <section className="panel">
        <h3>Decision Matrix</h3>
        <div className="map-grid">
          <MapList title="Options" items={decision.map.options.map((option) => option.label)} />
          <MapList title="Criteria" items={decision.map.criteria.map((criterion) => criterion.label)} />
          <MapList title="Constraints" items={decision.map.constraints} />
          <MapList title="Open questions" items={decision.map.openQuestions} />
        </div>
      </section>

      <section className="purchase-board" aria-label="Purchase decision workspace">
        <section className="panel">
          <p className="eyebrow">Your contenders</p>
          <h3>{purchaseModel.candidates.length} options to explore</h3>
          <div className="contender-grid">
            {purchaseModel.candidates.map((candidate) => <article className="contender-card" key={candidate.id}>
              <span className="candidate-mark" aria-hidden="true">{candidate.label.slice(0, 1).toUpperCase()}</span>
              <h4>{candidate.label}</h4>
              {candidate.provisional && <span className="provisional-tag">Suggested · review</span>}
              {candidate.price ? <p>{candidate.price.currency} {candidate.price.amount}</p> : <p className="muted">Price not yet confirmed</p>}
            </article>)}
          </div>
          {left && right && <div className="exercise-card">
            <p className="eyebrow">Preference exercise · pairwise choice</p>
            <p>Your answer is saved as a preference. It does not become a numeric score.</p>
            <A2uiPairwiseChoice leftLabel={left.label} rightLabel={right.label} onChoice={setPairwiseChoice} />
            <button className="composer-submit" type="button" disabled={!pairwiseChoice} onClick={commitPairwise}>Save preference</button>
            <p className="muted" role="status">{saveState}</p>
          </div>}
        </section>

        <section className="panel">
          <p className="eyebrow">Explore tradeoffs</p>
          <h3>Change the scenario</h3>
          <label className="what-if-control">Maximum price increase you would consider
            <input type="range" min="0" max="1000" step="50" value={scenarioPrice} onChange={(event) => setScenarioPrice(Number(event.target.value))} />
            <output>{decision.map.constraints.find((item) => /\$|budget|price/i.test(item)) ? `${scenarioPrice} more than your stated limit` : `$${scenarioPrice} additional budget`}</output>
          </label>
          <p className="muted">This preview changes the scenario only. Apply a result to make it part of your preferences.</p>
          <h4>Rank what matters</h4>
          <ol className="ranker-list" aria-label="Rank purchase options">
            {(candidateRank.length ? candidateRank : purchaseModel.candidates.map(({ id }) => id)).map((id, index, items) => {
              const item = purchaseModel.candidates.find((candidate) => candidate.id === id)!;
              return <li key={id}><span>{index + 1}. {item.label}</span><button type="button" disabled={index === 0} aria-label={`Move ${item.label} up`} onClick={() => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; setCandidateRank(next); }}>↑</button><button type="button" disabled={index === items.length - 1} aria-label={`Move ${item.label} down`} onClick={() => { const next = [...items]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; setCandidateRank(next); }}>↓</button></li>;
            })}
          </ol>
          <button type="button" onClick={() => setPurchaseModel((current) => ({ ...current, revision: current.revision + 1, preferences: [...current.preferences, { id: crypto.randomUUID(), kind: "candidate-rank", payload: { orderedIds: candidateRank.length ? candidateRank : current.candidates.map(({ id }) => id) }, provenance: "user-stated" }] }))}>Apply ranking</button>
        </section>

        <section className="panel brief-panel">
          <p className="eyebrow">Decision brief</p>
          <h3>Choose your next step</h3>
          <select aria-label="Decision outcome" value={briefOutcome} onChange={(event) => setBriefOutcome(event.target.value)}>
            <option value="buy">Buy</option><option value="wait">Wait</option><option value="dont-buy">Don't buy</option><option value="investigate-further">Investigate further</option>
          </select>
          <p>Preference observations: {purchaseModel.preferences.length}. Source-backed facts and unresolved questions will appear here as research is connected.</p>
          <button type="button" onClick={() => window.print()}>Print decision brief · {briefOutcome.replaceAll("-", " ")}</button>
        </section>
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
        <h3>Outcome Summary</h3>
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
