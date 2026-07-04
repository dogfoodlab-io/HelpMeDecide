import { Sparkles } from "lucide-react";
import { useState } from "react";
import { composerTemplateChips } from "../domain/templates";

interface ComposerProps {
  onCreate: (prompt: string) => void;
}

export function Composer({ onCreate }: ComposerProps) {
  const [prompt, setPrompt] = useState("");

  return (
    <section className="composer">
      <p className="eyebrow">HelpMeDecide.ai</p>
      <h1>What are you deciding?</h1>
      <div className="composer-box">
        <textarea
          aria-label="Decision prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe the decision, options, constraints, and people involved."
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
          <Sparkles size={18} aria-hidden="true" />
          Create decision workspace
        </button>
      </div>
    </section>
  );
}
