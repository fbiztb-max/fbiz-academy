import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Trophy, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  SIMULATION_DISCLAIMER,
  SimulationQuestion,
  SimulationResult,
  scoreSimulation,
} from "./types";

interface Props {
  question: SimulationQuestion;
  onComplete: (result: SimulationResult, normalizedScore: number) => void;
}

export default function SimulationPlayer({ question, onComplete }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SimulationResult | null>(null);

  const step = question.steps[stepIndex];
  const isLast = stepIndex === question.steps.length - 1;

  const pick = (decisionId: string) => {
    const next = { ...choices, [step.id]: decisionId };
    setChoices(next);
    if (isLast) {
      const r = scoreSimulation(question, next);
      setResult(r);
      const normalized = Math.round((r.performanceScore + r.decisionQualityIndex) / 2);
      onComplete(r, normalized);
    } else {
      setTimeout(() => setStepIndex((i) => i + 1), 250);
    }
  };

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="rounded-2xl bg-warning/10 border-2 border-warning/40 p-3 flex items-start gap-2">
          <GraduationCap className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs font-bold">{SIMULATION_DISCLAIMER}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="surface-card p-4 text-center">
            <Trophy className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-[11px] text-muted-foreground font-bold">مؤشر الأداء التعليمي</div>
            <div className="text-3xl font-black text-primary">{result.performanceScore}</div>
          </div>
          <div className="surface-card p-4 text-center">
            <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
            <div className="text-[11px] text-muted-foreground font-bold">مؤشر جودة القرارات</div>
            <div className="text-3xl font-black text-primary">{result.decisionQualityIndex}</div>
          </div>
        </div>

        <div className="surface-card p-4 space-y-3">
          <div className="flex items-center gap-2 font-black text-sm">
            <Sparkles className="h-4 w-4 text-primary" /> ملخص التعلّم
          </div>
          {result.feedback.map((f, i) => (
            <div key={i} className="rounded-xl bg-muted/40 p-3 text-sm">
              <div className="text-xs text-muted-foreground mb-1">{f.stepPrompt}</div>
              <div className="font-bold mb-1">قرارك: {f.chosen}</div>
              <div className="text-xs text-foreground/80">{f.rationale}</div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

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

      <div className="surface-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground">
            الموقف {stepIndex + 1} من {question.steps.length}
          </span>
          <span className="text-xs font-bold text-primary">قرار تعليمي</span>
        </div>
        <p className="font-bold leading-relaxed">{step.prompt}</p>
        <div className="space-y-2">
          {step.decisions.map((d) => (
            <button
              key={d.id}
              onClick={() => pick(d.id)}
              className={cn(
                "w-full text-right p-4 rounded-xl border-2 transition-all font-medium",
                choices[step.id] === d.id
                  ? "border-primary bg-primary/10 shadow-gold-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              )}
            >
              {d.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
