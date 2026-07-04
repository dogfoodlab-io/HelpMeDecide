import { useRef, useState } from "react";
import { generateDossier } from "../domain/dossier";
import { calculateWeightedScoring } from "../domain/frameworks";
import { recommendFramework } from "../domain/frameworkRecommender";
import { createDecisionFromPrompt } from "../domain/promptParser";
import type { Decision, Dossier, FrameworkRun } from "../domain/types";

function slug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function useDecisionWorkspace(now = new Date().toISOString()) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [frameworkRun, setFrameworkRun] = useState<FrameworkRun | null>(null);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const decisionRef = useRef<Decision | null>(null);
  const frameworkRunRef = useRef<FrameworkRun | null>(null);

  function createFromPrompt(prompt: string) {
    const nextDecision = createDecisionFromPrompt({
      prompt,
      ownerId: "owner-1",
      now,
    });
    const recommendation = recommendFramework(nextDecision);
    const nextFrameworkRun: FrameworkRun = {
      id: `run-${nextDecision.id}`,
      type: recommendation.type,
      status: "configured",
      recommendation,
      results: null,
    };
    decisionRef.current = nextDecision;
    frameworkRunRef.current = nextFrameworkRun;
    setDecision(nextDecision);
    setFrameworkRun(nextFrameworkRun);
    setDossier(null);
  }

  function addOption(label: string) {
    const updateDecision = (current: Decision | null) => {
      if (!current) return current;
      const option = { id: `option-${slug(label)}`, label };
      return {
        ...current,
        map: {
          ...current.map,
          options: [
            ...current.map.options.filter((item) => item.id !== option.id),
            option,
          ],
        },
      };
    };
    decisionRef.current = updateDecision(decisionRef.current);
    setDecision((current) => updateDecision(current));
  }

  function runWeightedScoring(scores: Record<string, Record<string, number>>) {
    const currentDecision = decisionRef.current;
    const currentFrameworkRun = frameworkRunRef.current;
    if (!currentDecision || !currentFrameworkRun) return;
    const results = calculateWeightedScoring({
      options: currentDecision.map.options,
      criteria: currentDecision.map.criteria,
      scores,
    });
    const nextFrameworkRun: FrameworkRun = {
      ...currentFrameworkRun,
      type: "weighted-scoring",
      status: "complete",
      results,
    };
    frameworkRunRef.current = nextFrameworkRun;
    setFrameworkRun(nextFrameworkRun);
  }

  function generateFinalDossier() {
    const currentDecision = decisionRef.current;
    const currentFrameworkRun = frameworkRunRef.current;
    if (!currentDecision || !currentFrameworkRun?.results) return;
    setDossier(generateDossier(currentDecision, currentFrameworkRun.results));
  }

  return {
    decision,
    frameworkRun,
    dossier,
    createFromPrompt,
    addOption,
    runWeightedScoring,
    generateFinalDossier,
  };
}
