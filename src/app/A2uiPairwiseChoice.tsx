import { useEffect, useMemo, useState } from "react";
import { A2uiSurface } from "@a2ui/react/v0_9";
import { basicCatalog } from "@a2ui/web_core/v0_9/basic_catalog";
import { MessageProcessor } from "@a2ui/web_core/v0_9";
import type { PairwiseChoice } from "../domain/purchaseDecision";

const choices: Array<{ id: PairwiseChoice; label: string }> = [
  { id: "left", label: "I prefer this one" },
  { id: "right", label: "I prefer that one" },
  { id: "tie", label: "I like them equally" },
  { id: "neither", label: "Neither feels right" },
  { id: "unsure", label: "I'm not sure yet" },
];

export function createPairwiseChoiceProcessor(
  leftLabel: string,
  rightLabel: string,
  onChoice: (choice: PairwiseChoice) => void,
) {
  const processor = new MessageProcessor<any>([basicCatalog], (action) => {
    if (action.name !== "pairwise-choice") return;
    const selected = action.context.choice;
    if (choices.some(({ id }) => id === selected)) onChoice(selected as PairwiseChoice);
  });
  const components = [
    { id: "root", component: "Column", children: ["prompt", "context", ...choices.map(({ id }) => `choice-${id}`)] },
    { id: "prompt", component: "Text", text: "Which feels more right for you?" },
    { id: "context", component: "Text", text: `${leftLabel} or ${rightLabel}` },
    ...choices.map(({ id }) => ({
      id: `choice-${id}`,
      component: "Button",
      child: `choice-label-${id}`,
      variant: "default",
      action: { event: { name: "pairwise-choice", context: { choice: id } } },
    })),
    ...choices.map(({ id, label }) => ({
      id: `choice-label-${id}`,
      component: "Text",
      text: `${label} · ${id === "left" ? leftLabel : id === "right" ? rightLabel : ""}`.trim(),
    })),
  ];
  processor.processMessages([
    { version: "v0.9.1", createSurface: { surfaceId: "pairwise-choice", catalogId: basicCatalog.id } },
    { version: "v0.9.1", updateComponents: { surfaceId: "pairwise-choice", components } },
  ]);
  return processor;
}

/** A bounded, app-authored A2UI surface for the first decision exercise. */
export function A2uiPairwiseChoice({
  leftLabel,
  rightLabel,
  onChoice,
}: {
  leftLabel: string;
  rightLabel: string;
  onChoice: (choice: PairwiseChoice) => void;
}) {
  const processor = useMemo(() => createPairwiseChoiceProcessor(leftLabel, rightLabel, onChoice), [leftLabel, onChoice, rightLabel]);
  const [surface, setSurface] = useState(() => processor.model.surfacesMap.get("pairwise-choice"));

  useEffect(() => {
    const sync = () => setSurface(processor.model.surfacesMap.get("pairwise-choice"));
    const subscription = processor.onSurfaceCreated(sync);
    sync();
    return () => {
      subscription.unsubscribe();
      processor.dispose();
    };
  }, [processor]);

  return surface ? <div className="a2ui-exercise"><A2uiSurface surface={surface} /></div> : null;
}
