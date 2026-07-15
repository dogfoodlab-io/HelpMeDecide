import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Check,
  Database,
  FileText,
  MessageCircleMore,
  Scale,
  Sparkles,
  UsersRound,
  Vote,
} from "lucide-react";
import { composerTemplateChips } from "../domain/templates";

interface ComposerProps {
  onCreate: (prompt: string) => void;
}

const methodCards = [
  {
    number: "01",
    title: "Quick signal",
    method: "Approval vote",
    copy: "A low-stakes choice with clear options needs momentum, not ceremony.",
  },
  {
    number: "02",
    title: "Shared preference",
    method: "Ranked choice",
    copy: "Find the option with durable support when everyone ranks the field differently.",
  },
  {
    number: "03",
    title: "Hard tradeoffs",
    method: "Weighted scoring",
    copy: "Make cost, risk, speed, quality, and strategic fit explicit and inspectable.",
  },
  {
    number: "04",
    title: "Expert territory",
    method: "Panel + owner call",
    copy: "Gather independent judgment, preserve dissent, then make ownership unmistakable.",
  },
];

const inputLanes = [
  {
    label: "People",
    Icon: UsersRound,
    copy: "Rankings, comments, confidence, disagreement.",
    color: "blue",
  },
  {
    label: "Evidence",
    Icon: Database,
    copy: "Prices, research, sources, constraints, unknowns.",
    color: "yellow",
  },
  {
    label: "AI thinking",
    Icon: Sparkles,
    copy: "Criteria, blind spots, options, counterarguments.",
    color: "red",
  },
  {
    label: "Context",
    Icon: MessageCircleMore,
    copy: "Notes, links, attachments, history, deadlines.",
    color: "ivory",
  },
];

const dossierItems = [
  "The recommendation — and the runner-up",
  "The framework and why it fit",
  "Weighted criteria and source evidence",
  "Dissent, uncertainty, and swing factors",
  "Assumptions, risks, and next actions",
];

export function Composer({ onCreate }: ComposerProps) {
  const [prompt, setPrompt] = useState("");

  const createDecision = () => {
    const decisionPrompt = prompt.trim();
    if (decisionPrompt) onCreate(decisionPrompt);
  };

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <a className="wordmark" href="#top" aria-label="HelpMeDecide.ai home">
          <EvidenceFoldMark />
          <span>HelpMeDecide.ai</span>
        </a>
        <nav className="landing-nav-links" aria-label="Primary navigation">
          <a href="#method">The method</a>
          <a href="#dossier">The dossier</a>
          <a href="#start">Start a decision</a>
        </nav>
        <a className="nav-cta" href="#start">
          Make a decision <ArrowDownRight size={16} aria-hidden="true" />
        </a>
      </header>

      <main>
        <section className="landing-hero" id="top">
          <div className="hero-grid">
            <div className="hero-message">
              <p className="signal-label reveal reveal-1">
                A decision system for messy, consequential choices
              </p>
              <h1 className="reveal reveal-2">
                Make the call.
                <span>Keep the receipts.</span>
              </h1>
              <p className="hero-intro reveal reveal-3">
                HelpMeDecide turns scattered opinions, evidence, and constraints
                into the right process — then a clear recommendation everyone can
                inspect.
              </p>
              <div className="hero-proof reveal reveal-4" aria-label="Product outcomes">
                <span><Check size={15} aria-hidden="true" /> The right method</span>
                <span><Check size={15} aria-hidden="true" /> Visible tradeoffs</span>
                <span><Check size={15} aria-hidden="true" /> A decision dossier</span>
              </div>
            </div>

            <div className="hero-art reveal reveal-3" aria-label="A decision path moving from ambiguity to clarity">
              <img
                src="/decision-atlas.jpg"
                alt="Abstract paper decision map with a vivid blue path crossing layered evidence cards"
              />
              <div className="art-scrim" />
              <div className="method-ticket ticket-one">
                <span>Input state</span>
                <strong>4 options · 7 constraints</strong>
              </div>
              <div className="method-ticket ticket-two">
                <span>Method fit</span>
                <strong>Weighted score + expert review</strong>
              </div>
              <div className="confidence-dial" aria-hidden="true">
                <span>82</span>
                <small>confidence</small>
              </div>
              <svg className="art-route" viewBox="0 0 640 540" aria-hidden="true">
                <path d="M34 458 C158 438 158 334 274 326 S422 172 600 80" />
                <circle cx="34" cy="458" r="7" />
                <circle cx="274" cy="326" r="7" />
                <circle cx="600" cy="80" r="10" />
              </svg>
            </div>
          </div>

          <div className="decision-composer reveal reveal-4" id="start">
            <div className="composer-heading">
              <span className="composer-index">01</span>
              <div>
                <p className="signal-label">Start in plain language</p>
                <h2>What are you deciding?</h2>
              </div>
            </div>
            <div className="composer-field">
              <textarea
                aria-label="Decision prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    createDecision();
                  }
                }}
                placeholder="We need to choose between three agencies for our rebrand. We care about strategic depth, speed, budget, and category experience…"
              />
              <button
                type="button"
                className="composer-submit"
                onClick={createDecision}
                disabled={!prompt.trim()}
                aria-label="Create decision workspace"
              >
                <span>Create decision workspace</span>
                <ArrowRight size={22} aria-hidden="true" />
              </button>
            </div>
            <div className="composer-foot">
              <div className="template-list" aria-label="Decision starter chips">
                {composerTemplateChips.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="template-chip"
                    onClick={() => setPrompt(template.promptSeed)}
                  >
                    {template.label}
                  </button>
                ))}
              </div>
              <span className="shortcut-note">⌘ + Enter to begin</span>
            </div>
          </div>
        </section>

        <div className="kinetic-rail" aria-hidden="true">
          <div>
            <span>OPTIONS</span><i>◆</i><span>CRITERIA</span><i>◆</i>
            <span>EVIDENCE</span><i>◆</i><span>PEOPLE</span><i>◆</i>
            <span>FRAMEWORK</span><i>◆</i><span>DOSSIER</span><i>◆</i>
            <span>OPTIONS</span><i>◆</i><span>CRITERIA</span><i>◆</i>
            <span>EVIDENCE</span><i>◆</i><span>PEOPLE</span><i>◆</i>
          </div>
        </div>

        <section className="method-section" id="method">
          <div className="section-number">02 / METHOD</div>
          <div className="section-lead method-lead">
            <p className="signal-label">First decide how to decide</p>
            <h2>One-size-fits-all voting is where good decisions go to die.</h2>
            <p>
              A dinner plan and a strategic acquisition should not use the same
              machinery. HelpMeDecide reads the shape of the choice — stakes,
              uncertainty, disagreement, evidence — and routes it accordingly.
            </p>
          </div>

          <div className="method-layout">
            <div className="method-orbit">
              <img src="/decision-constellation.svg" alt="Decision method routing diagram" />
              <div className="orbit-note note-stakes">Stakes</div>
              <div className="orbit-note note-evidence">Evidence</div>
              <div className="orbit-note note-people">People</div>
              <div className="orbit-note note-time">Time</div>
            </div>
            <div className="method-card-list">
              {methodCards.map((card) => (
                <article className="method-row" key={card.number}>
                  <span className="method-number">{card.number}</span>
                  <div>
                    <p>{card.title}</p>
                    <h3>{card.method}</h3>
                  </div>
                  <p className="method-copy">{card.copy}</p>
                  <ArrowDownRight size={22} aria-hidden="true" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="inputs-section">
          <div className="section-number light">03 / INPUTS</div>
          <div className="inputs-heading">
            <p className="signal-label">Mess in. Structure out.</p>
            <h2>Every useful signal gets a lane.</h2>
            <p>
              No giant intake form. The workspace asks for the next input that
              can actually change the decision.
            </p>
          </div>
          <div className="input-lanes">
            {inputLanes.map(({ label, Icon, copy, color }, index) => (
              <article className={`input-lane lane-${color}`} key={label}>
                <div className="lane-top">
                  <span>0{index + 1}</span>
                  <Icon size={25} strokeWidth={1.7} aria-hidden="true" />
                </div>
                <h3>{label}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="dossier-section" id="dossier">
          <div className="dossier-story">
            <div className="section-number">04 / OUTPUT</div>
            <p className="signal-label">A record, not a reveal</p>
            <h2>The answer matters. The reasoning travels further.</h2>
            <p className="dossier-intro">
              Every decision ends in a shareable dossier: what won, what nearly
              won, what remains uncertain, and which new fact would change the call.
            </p>
            <ul className="dossier-list">
              {dossierItems.map((item) => (
                <li key={item}><Check size={17} aria-hidden="true" />{item}</li>
              ))}
            </ul>
          </div>

          <div className="dossier-visual" aria-label="Example decision dossier">
            <div className="dossier-paper paper-back" />
            <div className="dossier-paper paper-middle" />
            <article className="dossier-paper paper-front">
              <header>
                <EvidenceFoldMark />
                <span>DECISION DOSSIER / 024</span>
                <FileText size={19} aria-hidden="true" />
              </header>
              <p className="paper-label">Vendor selection · final</p>
              <h3>Choose Aster Studio.</h3>
              <div className="score-line">
                <strong>87.4</strong>
                <div><span>Confidence</span><b>High, with one swing factor</b></div>
              </div>
              <div className="paper-bars" aria-label="Weighted criteria preview">
                <ScoreBar label="Strategic fit" value="94" width="94%" />
                <ScoreBar label="Speed" value="78" width="78%" />
                <ScoreBar label="Budget" value="81" width="81%" />
                <ScoreBar label="References" value="90" width="90%" />
              </div>
              <div className="swing-note">
                <Scale size={20} aria-hidden="true" />
                <p><span>Swing factor</span>Northline wins if timeline weight rises above 31%.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="voting-section">
          <div className="section-number">05 / COLLECTIVE CHOICE</div>
          <div className="voting-grid">
            <div className="voting-copy">
              <p className="signal-label">Better than “pick one”</p>
              <h2>Voting tools with an actual point of view.</h2>
              <p>
                Ranked choice, Borda count, pairwise comparison, approval, score
                voting — expressive ballots reveal the shape of consensus, not
                just the loudest favorite.
              </p>
              <div className="voting-icons" aria-hidden="true">
                <Vote size={22} /><BarChart3 size={22} /><Scale size={22} />
              </div>
            </div>
            <div className="ballot-visual">
              <div className="ballot-head"><span>RANKED BALLOT</span><span>BORDA PTS</span></div>
              <BallotRow rank="1" option="Aster Studio" points="4" width="92%" color="red" />
              <BallotRow rank="2" option="Northline" points="3" width="74%" color="blue" />
              <BallotRow rank="3" option="Packet House" points="2" width="51%" color="yellow" />
              <BallotRow rank="4" option="Fieldwork" points="1" width="27%" color="ink" />
              <footer><span>Broad support beats a polarizing favorite.</span><strong>12 ballots</strong></footer>
            </div>
          </div>
        </section>

        <section className="closing-section">
          <div className="closing-mark" aria-hidden="true">?</div>
          <p className="signal-label">The next call is yours</p>
          <h2>Less circling.<br />More deciding.</h2>
          <a href="#start" className="closing-cta">
            Start a decision <ArrowRight size={25} aria-hidden="true" />
          </a>
        </section>
      </main>

      <footer className="landing-footer">
        <a className="wordmark" href="#top"><EvidenceFoldMark /><span>HelpMeDecide.ai</span></a>
        <p>Structure for choices that deserve more than a gut check.</p>
        <span>© 2026</span>
      </footer>
    </div>
  );
}

function EvidenceFoldMark() {
  return (
    <img
      className="decision-mark"
      src="/evidence-fold-mark.svg"
      alt=""
      aria-hidden="true"
    />
  );
}

function ScoreBar({ label, value, width }: { label: string; value: string; width: string }) {
  return (
    <div className="score-bar">
      <span>{label}</span>
      <div><i style={{ width }} /></div>
      <b>{value}</b>
    </div>
  );
}

function BallotRow({
  rank,
  option,
  points,
  width,
  color,
}: {
  rank: string;
  option: string;
  points: string;
  width: string;
  color: string;
}) {
  return (
    <div className="ballot-row">
      <span className="ballot-rank">{rank}</span>
      <div className="ballot-option">
        <strong>{option}</strong>
        <i className={`ballot-bar bar-${color}`} style={{ width }} />
      </div>
      <b>{points}</b>
    </div>
  );
}
