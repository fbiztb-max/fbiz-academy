// Simulation stage type — fictional, decision-based educational scenarios.
// Lives inside the existing `stages.questions` JSONB array as one question
// of type "simulation". Backward-compatible with all other question types.

export interface SimulationDecision {
  id: string;
  text: string;
  /** Internal abstract impact, not real-world units */
  impact: number; // -10 .. +10
  /** Educational rationale shown in feedback */
  rationale: string;
}

export interface SimulationStep {
  id: string;
  prompt: string;
  decisions: SimulationDecision[];
}

export interface SimulationQuestion {
  id: string;
  type: "simulation";
  text: string; // scenario title
  scenario: string; // long description (fictional)
  steps: SimulationStep[];
  points: number; // counted in stage total
}

export const FICTIONAL_GUARD_TERMS = [
  "ربح", "خسارة", "استثمار", "سوق", "إيرادات",
  "profit", "loss", "investment", "market", "revenue",
];

export const SIMULATION_DISCLAIMER =
  "هذه محاكاة تعليمية افتراضية ولا تمثل أي نتائج واقعية";

export function newSimulationDecision(): SimulationDecision {
  return {
    id: crypto.randomUUID(),
    text: "",
    impact: 0,
    rationale: "",
  };
}

export function newSimulationStep(): SimulationStep {
  return {
    id: crypto.randomUUID(),
    prompt: "",
    decisions: [newSimulationDecision(), newSimulationDecision()],
  };
}

export function newSimulationQuestion(): SimulationQuestion {
  return {
    id: crypto.randomUUID(),
    type: "simulation",
    text: "",
    scenario: "",
    steps: [newSimulationStep()],
    points: 100,
  };
}

/** Validates that no real-world finance terminology slipped into the text */
export function detectRealismViolations(input: string): string[] {
  const lc = input.toLowerCase();
  return FICTIONAL_GUARD_TERMS.filter((t) => lc.includes(t.toLowerCase()));
}

export interface SimulationResult {
  performanceScore: number;        // 0..100
  decisionQualityIndex: number;    // 0..100
  feedback: Array<{ stepPrompt: string; chosen: string; rationale: string; impact: number }>;
}

/**
 * Pure scoring function — no real-world data, no external calls.
 * Performance Score = normalized sum of impacts.
 * Decision Quality Index = % of decisions whose impact is in the top tier per step.
 */
export function scoreSimulation(
  q: SimulationQuestion,
  choices: Record<string, string>, // stepId -> decisionId
): SimulationResult {
  let totalImpact = 0;
  let maxImpact = 0;
  let topPicks = 0;
  const feedback: SimulationResult["feedback"] = [];

  for (const step of q.steps) {
    const chosenId = choices[step.id];
    const chosen = step.decisions.find((d) => d.id === chosenId);
    const stepMax = Math.max(...step.decisions.map((d) => d.impact), 0);
    maxImpact += Math.max(stepMax, 1);
    if (chosen) {
      totalImpact += chosen.impact;
      if (chosen.impact === stepMax && stepMax > 0) topPicks++;
      feedback.push({
        stepPrompt: step.prompt,
        chosen: chosen.text,
        rationale: chosen.rationale,
        impact: chosen.impact,
      });
    }
  }

  const performanceScore = Math.max(0, Math.min(100, Math.round((totalImpact / Math.max(maxImpact, 1)) * 100)));
  const decisionQualityIndex = q.steps.length === 0 ? 0 : Math.round((topPicks / q.steps.length) * 100);

  return { performanceScore, decisionQualityIndex, feedback };
}
