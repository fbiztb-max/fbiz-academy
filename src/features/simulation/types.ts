// Simulation stage type — fictional, decision-based educational scenarios.
// Goal-driven: users win/lose based on accumulated state changes across turns.
// Lives inside the existing `stages.questions` JSONB array as one question
// of type "simulation". Backward-compatible with all other question types.

export type StateKey = "progress" | "stability" | "resources" | "risk";

export const STATE_LABELS: Record<StateKey, string> = {
  progress: "التقدّم",
  stability: "الاستقرار",
  resources: "الموارد",
  risk: "المخاطر",
};

export interface StateDelta {
  progress?: number;
  stability?: number;
  resources?: number;
  risk?: number;
}

export interface SimulationDecision {
  id: string;
  text: string;
  /** Internal abstract impact, not real-world units */
  impact: number; // -10 .. +10
  /** Educational rationale shown in feedback */
  rationale: string;
  /** Effect on simulation state variables (each -50..+50) */
  effects?: StateDelta;
}

export interface SimulationStep {
  id: string;
  prompt: string;
  decisions: SimulationDecision[];
}

export interface SimulationConditions {
  win: { progress?: number; stability?: number; resources?: number; risk?: number };
  fail: { progress?: number; stability?: number; resources?: number; risk?: number };
}

export interface SimulationQuestion {
  id: string;
  type: "simulation";
  text: string; // scenario title
  scenario: string; // long description (fictional)
  steps: SimulationStep[];
  points: number; // counted in stage total
  /** Maximum number of turns before evaluation */
  maxTurns?: number;
  /** Initial state values (default 50 each, risk default 20) */
  initialState?: StateDelta;
  /** Win/Fail thresholds */
  conditions?: SimulationConditions;
}

export const FICTIONAL_GUARD_TERMS = [
  "ربح", "خسارة", "استثمار", "سوق", "إيرادات",
  "profit", "loss", "investment", "market", "revenue",
];

export const SIMULATION_DISCLAIMER =
  "هذه محاكاة تعليمية افتراضية ولا تمثل أي نتائج واقعية";

export const DEFAULT_INITIAL_STATE: Required<StateDelta> = {
  progress: 20,
  stability: 60,
  resources: 70,
  risk: 30,
};

export const DEFAULT_CONDITIONS: SimulationConditions = {
  win: { progress: 80, stability: 60, risk: 40 },   // risk is upper-bound
  fail: { resources: 0, risk: 90, stability: 20 },  // resources/stability lower-bound, risk upper-bound
};

export const DEFAULT_MAX_TURNS = 10;

export function newSimulationDecision(): SimulationDecision {
  return {
    id: crypto.randomUUID(),
    text: "",
    impact: 0,
    rationale: "",
    effects: { progress: 0, stability: 0, resources: 0, risk: 0 },
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
    maxTurns: DEFAULT_MAX_TURNS,
    initialState: { ...DEFAULT_INITIAL_STATE },
    conditions: { win: { ...DEFAULT_CONDITIONS.win }, fail: { ...DEFAULT_CONDITIONS.fail } },
  };
}

/** Validates that no real-world finance terminology slipped into the text */
export function detectRealismViolations(input: string): string[] {
  const lc = (input || "").toLowerCase();
  return FICTIONAL_GUARD_TERMS.filter((t) => lc.includes(t.toLowerCase()));
}

export type SimulationOutcome = "success" | "needs_improvement" | "failed";

export interface SimulationResult {
  performanceScore: number;        // 0..100
  decisionQualityIndex: number;    // 0..100
  outcome: SimulationOutcome;
  endReason: "win" | "fail" | "turn_limit";
  finalState: Required<StateDelta>;
  turnsUsed: number;
  feedback: Array<{ stepPrompt: string; chosen: string; rationale: string; impact: number; stateAfter: Required<StateDelta> }>;
}

export function clampState(s: Required<StateDelta>): Required<StateDelta> {
  const c = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  return { progress: c(s.progress), stability: c(s.stability), resources: c(s.resources), risk: c(s.risk) };
}

export function applyEffects(state: Required<StateDelta>, effects?: StateDelta): Required<StateDelta> {
  if (!effects) return state;
  return clampState({
    progress: state.progress + (effects.progress ?? 0),
    stability: state.stability + (effects.stability ?? 0),
    resources: state.resources + (effects.resources ?? 0),
    risk: state.risk + (effects.risk ?? 0),
  });
}

export function checkWin(state: Required<StateDelta>, c: SimulationConditions["win"]): boolean {
  if (c.progress !== undefined && state.progress < c.progress) return false;
  if (c.stability !== undefined && state.stability < c.stability) return false;
  if (c.resources !== undefined && state.resources < c.resources) return false;
  if (c.risk !== undefined && state.risk > c.risk) return false;
  return true;
}

export function checkFail(state: Required<StateDelta>, c: SimulationConditions["fail"]): boolean {
  if (c.resources !== undefined && state.resources <= c.resources) return true;
  if (c.stability !== undefined && state.stability <= c.stability) return true;
  if (c.risk !== undefined && state.risk >= c.risk) return true;
  if (c.progress !== undefined && state.progress <= c.progress) return true;
  return false;
}

export function getInitialState(q: SimulationQuestion): Required<StateDelta> {
  const s = q.initialState ?? {};
  return clampState({
    progress: s.progress ?? DEFAULT_INITIAL_STATE.progress,
    stability: s.stability ?? DEFAULT_INITIAL_STATE.stability,
    resources: s.resources ?? DEFAULT_INITIAL_STATE.resources,
    risk: s.risk ?? DEFAULT_INITIAL_STATE.risk,
  });
}

export function getConditions(q: SimulationQuestion): SimulationConditions {
  return q.conditions ?? DEFAULT_CONDITIONS;
}

export function getMaxTurns(q: SimulationQuestion): number {
  return q.maxTurns ?? DEFAULT_MAX_TURNS;
}

/**
 * Final scoring + outcome — based on accumulated state, not "correct answers".
 */
export function evaluateSimulation(
  q: SimulationQuestion,
  history: Array<{ step: SimulationStep; decision: SimulationDecision; stateAfter: Required<StateDelta> }>,
  endReason: SimulationResult["endReason"],
): SimulationResult {
  const finalState = history.length > 0 ? history[history.length - 1].stateAfter : getInitialState(q);

  // Performance Score = blended state health (progress + stability + resources + (100 - risk)) / 4
  const performanceScore = Math.max(0, Math.min(100, Math.round(
    (finalState.progress + finalState.stability + finalState.resources + (100 - finalState.risk)) / 4,
  )));

  // Decision Quality = average of (positive impacts vs max possible per step)
  let qualityNum = 0;
  let qualityDen = 0;
  for (const h of history) {
    const stepMax = Math.max(...h.step.decisions.map((d) => d.impact));
    if (stepMax > 0) {
      qualityNum += Math.max(0, h.decision.impact);
      qualityDen += stepMax;
    }
  }
  const decisionQualityIndex = qualityDen === 0 ? performanceScore : Math.round((qualityNum / qualityDen) * 100);

  let outcome: SimulationOutcome;
  if (endReason === "win") outcome = "success";
  else if (endReason === "fail") outcome = "failed";
  else outcome = performanceScore >= 70 ? "success" : performanceScore >= 45 ? "needs_improvement" : "failed";

  return {
    performanceScore,
    decisionQualityIndex,
    outcome,
    endReason,
    finalState,
    turnsUsed: history.length,
    feedback: history.map((h) => ({
      stepPrompt: h.step.prompt,
      chosen: h.decision.text,
      rationale: h.decision.rationale,
      impact: h.decision.impact,
      stateAfter: h.stateAfter,
    })),
  };
}

/** Backwards-compat shim used by older code paths */
export function scoreSimulation(
  q: SimulationQuestion,
  choices: Record<string, string>,
): SimulationResult {
  let state = getInitialState(q);
  const history: Array<{ step: SimulationStep; decision: SimulationDecision; stateAfter: Required<StateDelta> }> = [];
  for (const step of q.steps) {
    const chosen = step.decisions.find((d) => d.id === choices[step.id]);
    if (!chosen) continue;
    state = applyEffects(state, chosen.effects);
    history.push({ step, decision: chosen, stateAfter: state });
  }
  return evaluateSimulation(q, history, "turn_limit");
}
