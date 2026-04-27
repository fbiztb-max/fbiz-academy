import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Trophy, Target, Sparkles, TrendingUp, Shield, Coins, AlertTriangle, Flag, XOctagon, Hourglass } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  SIMULATION_DISCLAIMER,
  SimulationQuestion,
  SimulationResult,
  StateDelta,
  applyEffects,
  checkFail,
  checkWin,
  evaluateSimulation,
  getConditions,
  getInitialState,
  getMaxTurns,
  SimulationStep,
  SimulationDecision,
} from "./types";

interface Props {
  question: SimulationQuestion;
  onComplete: (result: SimulationResult, normalizedScore: number) => void;
}

const STATE_META: Record<keyof Required<StateDelta>, { label: string; icon: any; tone: string }> = {
  progress:  { label: "التقدّم",   icon: TrendingUp, tone: "text-primary" },
  stability: { label: "الاستقرار", icon: Shield,     tone: "text-success" },
  resources: { label: "الموارد",   icon: Coins,      tone: "text-warning" },
  risk:      { label: "المخاطر",   icon: AlertTriangle, tone: "text-destructive" },
};

export default function SimulationPlayer({ question, onComplete }: Props) {
  const initial = useMemo(() => getInitialState(question), [question]);
  const conditions = useMemo(() => getConditions(question), [question]);
  const maxTurns = getMaxTurns(question);

  const [state, setState] = useState(initial);
  const [turn, setTurn] = useState(0);
  const [history, setHistory] = useState<Array<{ step: SimulationStep; decision: SimulationDecision; stateAfter: Required<StateDelta> }>>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [lastDelta, setLastDelta] = useState<StateDelta | null>(null);

  // Cycle through defined steps if turns > steps
  const currentStep = question.steps[turn % Math.max(question.steps.length, 1)];

  const finish = (
    nextHistory: typeof history,
    endReason: SimulationResult["endReason"],
  ) => {
    const r = evaluateSimulation(question, nextHistory, endReason);
    setResult(r);
    const normalized = Math.round((r.performanceScore + r.decisionQualityIndex) / 2);
    onComplete(r, normalized);
  };

  const pick = (decision: SimulationDecision) => {
    if (result) return;
    const newState = applyEffects(state, decision.effects);
    const delta: StateDelta = {
      progress: newState.progress - state.progress,
      stability: newState.stability - state.stability,
      resources: newState.resources - state.resources,
      risk: newState.risk - state.risk,
    };
    setLastDelta(delta);
    setState(newState);
    const nextHistory = [...history, { step: currentStep, decision, stateAfter: newState }];
    setHistory(nextHistory);
    const nextTurn = turn + 1;
    setTurn(nextTurn);

    if (checkWin(newState, conditions.win))      finish(nextHistory, "win");
    else if (checkFail(newState, conditions.fail)) finish(nextHistory, "fail");
    else if (nextTurn >= maxTurns)               finish(nextHistory, "turn_limit");
  };

  if (result) return <ResultView result={result} question={question} />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-warning/10 border-2 border-warning/40 p-3 flex items-start gap-2">
        <GraduationCap className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs font-bold">{SIMULATION_DISCLAIMER}</p>
      </div>

      <div className="surface-card p-4">
        <div className="text-xs font-bold text-primary mb-1">سيناريو افتراضي</div>
        <h3 className="text-lg font-black mb-2">{question.text}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{question.scenario}</p>
      </div>

      <StatePanel state={state} delta={lastDelta} turn={turn} maxTurns={maxTurns} />

      <div className="surface-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">
            الجولة {turn + 1} من {maxTurns}
          </span>
          <span className="text-xs font-bold text-primary">قرار تعليمي</span>
        </div>
        <p className="font-bold leading-relaxed">{currentStep.prompt}</p>
        <div className="space-y-2">
          {currentStep.decisions.map((d) => (
            <button
              key={d.id}
              onClick={() => pick(d)}
              className="w-full text-right p-4 rounded-xl border-2 border-border hover:border-primary/40 hover:bg-muted/50 transition-all font-medium"
            >
              {d.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatePanel({
  state,
  delta,
  turn,
  maxTurns,
}: {
  state: Required<StateDelta>;
  delta: StateDelta | null;
  turn: number;
  maxTurns: number;
}) {
  return (
    <div className="surface-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black">حالة المحاكاة</span>
        <Badge variant="outline" className="gap-1">
          <Hourglass className="h-3 w-3" /> {turn}/{maxTurns}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(Object.keys(STATE_META) as (keyof Required<StateDelta>)[]).map((k) => {
          const Icon = STATE_META[k].icon;
          const value = state[k];
          const d = delta?.[k] ?? 0;
          return (
            <div key={k} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-bold">
                  <Icon className={cn("h-3.5 w-3.5", STATE_META[k].tone)} />
                  {STATE_META[k].label}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-black">{value}</span>
                  <AnimatePresence>
                    {d !== 0 && (
                      <motion.span
                        key={`${k}-${turn}`}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "text-[10px] font-bold",
                          d > 0 ? "text-success" : "text-destructive",
                        )}
                      >
                        {d > 0 ? `+${d}` : d}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </div>
              <Progress value={value} className="h-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultView({ result, question }: { result: SimulationResult; question: SimulationQuestion }) {
  const outcomeMeta = {
    success:           { label: "نجاح",         icon: Trophy,   tone: "text-success",     bg: "bg-success/10 border-success/40" },
    needs_improvement: { label: "يحتاج تحسين",  icon: Flag,     tone: "text-warning",     bg: "bg-warning/10 border-warning/40" },
    failed:            { label: "فشل",          icon: XOctagon, tone: "text-destructive", bg: "bg-destructive/10 border-destructive/40" },
  }[result.outcome];
  const OutcomeIcon = outcomeMeta.icon;

  const reasonText = {
    win: "تحققت شروط الفوز التعليمي",
    fail: "تم تشغيل أحد شروط الفشل",
    turn_limit: "انتهت الجولات وتم تقييم الأداء النهائي",
  }[result.endReason];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="rounded-2xl bg-warning/10 border-2 border-warning/40 p-3 flex items-start gap-2">
        <GraduationCap className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <p className="text-xs font-bold">{SIMULATION_DISCLAIMER}</p>
      </div>

      <div className={cn("rounded-2xl border-2 p-4 flex items-center gap-3", outcomeMeta.bg)}>
        <OutcomeIcon className={cn("h-8 w-8", outcomeMeta.tone)} />
        <div className="flex-1">
          <div className="text-xs text-muted-foreground font-bold">نتيجة المحاكاة</div>
          <div className={cn("text-xl font-black", outcomeMeta.tone)}>{outcomeMeta.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{reasonText} · {result.turnsUsed} جولة</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="surface-card p-4 text-center">
          <Trophy className="h-5 w-5 mx-auto mb-1 text-primary" />
          <div className="text-[11px] text-muted-foreground font-bold">مؤشر الأداء</div>
          <div className="text-3xl font-black text-primary">{result.performanceScore}</div>
        </div>
        <div className="surface-card p-4 text-center">
          <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
          <div className="text-[11px] text-muted-foreground font-bold">جودة القرارات</div>
          <div className="text-3xl font-black text-primary">{result.decisionQualityIndex}</div>
        </div>
      </div>

      <StatePanel state={result.finalState} delta={null} turn={result.turnsUsed} maxTurns={getMaxTurns(question)} />

      <div className="surface-card p-4 space-y-3">
        <div className="flex items-center gap-2 font-black text-sm">
          <Sparkles className="h-4 w-4 text-primary" /> ملخص الجولات
        </div>
        {result.feedback.map((f, i) => (
          <div key={i} className="rounded-xl bg-muted/40 p-3 text-sm">
            <div className="text-xs text-muted-foreground mb-1">جولة {i + 1} · {f.stepPrompt}</div>
            <div className="font-bold mb-1">قرارك: {f.chosen}</div>
            {f.rationale && <div className="text-xs text-foreground/80">{f.rationale}</div>}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
