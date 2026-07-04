import { useState } from "react";
import {
  ArrowRight,
  FileCheck2,
  GitBranch,
  MessagesSquare,
  SearchCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { composerTemplateChips } from "../domain/templates";

interface ComposerProps {
  onCreate: (prompt: string) => void;
}

const inputLanes = [
  {
    title: "Opinions",
    copy: "Gather rankings, dissent, comments, and confidence from the people involved.",
    Icon: UsersRound,
  },
  {
    title: "Data",
    copy: "Bring in prices, reviews, sources, constraints, and could-not-verify states.",
    Icon: SearchCheck,
  },
  {
    title: "AI Thinking",
    copy: "Surface criteria, tradeoffs, blind spots, options, and the right framework.",
    Icon: Sparkles,
  },
  {
    title: "Context",
    copy: "Turn notes, links, pasted text, and attachments into structured decision inputs.",
    Icon: MessagesSquare,
  },
];

export function Composer({ onCreate }: ComposerProps) {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="landing-page">
      <nav className="site-nav" aria-label="Primary">
        <a className="brand-mark" href="#top" aria-label="HelpMeDecide.ai home">
          <span className="brand-symbol">?</span>
          <span>HelpMeDecide.ai</span>
        </a>
        <div className="nav-links">
          <a href="#lanes">How it works</a>
          <a href="#dossier">Dossier</a>
          <a href="#try">Try it</a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Prompt-first decision workspace</p>
          <h1>Decide with structure before the group chat wins.</h1>
          <p className="hero-lede">
            HelpMeDecide.ai turns messy choices into a decision map, the right
            framework, useful input lanes, and a shareable dossier.
          </p>
          <div className="hero-actions">
            <a className="primary-action hero-action" href="#try">
              Start a decision <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a className="secondary-action" href="#dossier">
              See the artifact
            </a>
          </div>
        </div>

        <div className="decision-board" aria-label="Decision workspace preview">
          <div className="board-header">
            <span>Decision Map</span>
            <strong>74% confident</strong>
          </div>
          <div className="board-question">
            <span>Choosing a rebrand agency</span>
            <small>Team input + weighted scoring</small>
          </div>
          <div className="board-grid">
            <PreviewCard title="Options" items={["Northline", "Aster", "Packet House"]} />
            <PreviewCard title="Criteria" items={["Strategic fit", "Speed", "Budget"]} />
            <PreviewCard title="Evidence" items={["3 proposals", "2 references", "Scope notes"]} />
            <PreviewCard title="Open" items={["Timeline risk", "Founder preference"]} />
          </div>
          <div className="board-result">
            <FileCheck2 size={20} aria-hidden="true" />
            <span>Draft dossier ready: recommendation, rationale, dissent, risks.</span>
          </div>
        </div>
      </section>

      <section className="proof-strip" aria-label="Product capabilities">
        <div>
          <strong>Frameworks</strong>
          <span>Ranked choice, weighted scoring, pairwise comparison.</span>
        </div>
        <div>
          <strong>Collaboration</strong>
          <span>Solo decisions, groups, teams, owners, and dissent.</span>
        </div>
        <div>
          <strong>Output</strong>
          <span>A defensible decision dossier, not a chat transcript.</span>
        </div>
      </section>

      <section className="landing-section lanes-section" id="lanes">
        <div className="section-heading">
          <p className="eyebrow">Four input lanes</p>
          <h2>The app asks for the next useful input, not a long intake form.</h2>
        </div>
        <div className="lane-feature-grid">
          {inputLanes.map(({ title, copy, Icon }) => (
            <article className="feature-tile" key={title}>
              <Icon size={22} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section dossier-section" id="dossier">
        <div className="dossier-copy">
          <p className="eyebrow">Shareable final artifact</p>
          <h2>Get the recommendation, the rationale, and the uncertainty in one place.</h2>
          <p>
            The dossier captures the ranked options, criteria, evidence,
            disagreement, risks, assumptions, and next steps so the final call
            can be reviewed later.
          </p>
        </div>
        <div className="dossier-sheet">
          <div className="sheet-rule" />
          <h3>Decision Dossier</h3>
          <p className="muted">Recommended option</p>
          <strong>Aster Studio</strong>
          <ul>
            <li>Highest weighted score across strategy and speed.</li>
            <li>Budget risk remains visible, not hidden.</li>
            <li>Two dissenting notes preserved for the owner.</li>
          </ul>
          <div className="sheet-footer">
            <GitBranch size={18} aria-hidden="true" />
            <span>Framework: weighted scoring</span>
          </div>
        </div>
      </section>

      <section className="composer landing-composer" id="try" aria-labelledby="composer-title">
        <div className="composer-intro">
          <p className="eyebrow">Try the workspace</p>
          <h2 id="composer-title">What are you deciding?</h2>
          <p>
            Start with a plain-language prompt. Mention the options, people,
            constraints, timeline, or what feels unclear.
          </p>
        </div>
        <div className="composer-box">
          <textarea
            aria-label="Decision prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Example: Help our team choose between three agencies for a rebrand. We care about strategy, speed, budget, and how well they understand our market."
          />
          <div className="template-row" aria-label="Decision starter chips">
            {composerTemplateChips.map((template) => (
              <button
                key={template.id}
                type="button"
                className="chip"
                onClick={() => setPrompt(template.promptSeed)}
              >
                {template.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="primary-action"
            onClick={() => onCreate(prompt)}
            disabled={!prompt.trim()}
          >
            Create decision workspace <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}

function PreviewCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="preview-card">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
