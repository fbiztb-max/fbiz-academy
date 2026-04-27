import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, AlertTriangle, Settings2 } from "lucide-react";
import {
  SimulationQuestion,
  newSimulationStep,
  newSimulationDecision,
  detectRealismViolations,
  StateDelta,
  DEFAULT_INITIAL_STATE,
  DEFAULT_CONDITIONS,
  DEFAULT_MAX_TURNS,
} from "./types";

interface Props {
  value: SimulationQuestion;
  onChange: (next: SimulationQuestion) => void;
}

const STATE_KEYS: (keyof Required<StateDelta>)[] = ["progress", "stability", "resources", "risk"];
const STATE_LABEL: Record<keyof Required<StateDelta>, string> = {
  progress: "التقدّم",
  stability: "الاستقرار",
  resources: "الموارد",
  risk: "المخاطر",
};

export default function SimulationEditor({ value, onChange }: Props) {
  const violations = [
    ...detectRealismViolations(value.scenario),
    ...detectRealismViolations(value.text),
    ...value.steps.flatMap((s) => [
      ...detectRealismViolations(s.prompt),
      ...s.decisions.flatMap((d) => [
        ...detectRealismViolations(d.text),
        ...detectRealismViolations(d.rationale),
      ]),
    ]),
  ];

  const initialState = { ...DEFAULT_INITIAL_STATE, ...(value.initialState ?? {}) };
  const conditions = {
    win: { ...DEFAULT_CONDITIONS.win, ...(value.conditions?.win ?? {}) },
    fail: { ...DEFAULT_CONDITIONS.fail, ...(value.conditions?.fail ?? {}) },
  };
  const maxTurns = value.maxTurns ?? DEFAULT_MAX_TURNS;

  const updateStep = (idx: number, patch: Partial<typeof value.steps[number]>) => {
    const steps = [...value.steps];
    steps[idx] = { ...steps[idx], ...patch };
    onChange({ ...value, steps });
  };

  const updateEffect = (si: number, di: number, key: keyof Required<StateDelta>, raw: string) => {
    const n = Math.max(-50, Math.min(50, parseInt(raw || "0")));
    const ds = [...value.steps[si].decisions];
    ds[di] = { ...ds[di], effects: { ...(ds[di].effects ?? {}), [key]: n } };
    updateStep(si, { decisions: ds });
  };

  return (
    <div className="space-y-3">
      {violations.length > 0 && (
        <div className="rounded-xl bg-destructive/10 border-2 border-destructive/40 p-3 text-xs flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-destructive">كلمات محظورة في المحاكاة:</div>
            <div className="text-muted-foreground mt-1">{[...new Set(violations)].join("، ")}</div>
            <div className="text-muted-foreground mt-1">يجب أن تكون المحاكاة افتراضية وتعليمية بحتة.</div>
          </div>
        </div>
      )}

      <div>
        <Label>عنوان السيناريو الافتراضي</Label>
        <Input value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} />
      </div>

      <div>
        <Label>وصف السيناريو (افتراضي وتعليمي)</Label>
        <Textarea
          rows={4}
          value={value.scenario}
          onChange={(e) => onChange({ ...value, scenario: e.target.value })}
          placeholder="اكتب سيناريو افتراضي للتعلم..."
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>الدرجة الإجمالية</Label>
          <Input
            type="number"
            min={1}
            value={value.points}
            onChange={(e) => onChange({ ...value, points: parseInt(e.target.value || "100") })}
          />
        </div>
        <div>
          <Label>أقصى عدد جولات</Label>
          <Input
            type="number"
            min={1}
            max={50}
            value={maxTurns}
            onChange={(e) => onChange({ ...value, maxTurns: Math.max(1, Math.min(50, parseInt(e.target.value || "10"))) })}
          />
        </div>
      </div>

      {/* Initial state */}
      <div className="rounded-xl border-2 border-border p-3 space-y-2 bg-background">
        <div className="flex items-center gap-2 font-black text-sm">
          <Settings2 className="h-4 w-4 text-primary" /> الحالة الابتدائية (0–100)
        </div>
        <div className="grid grid-cols-2 gap-2">
          {STATE_KEYS.map((k) => (
            <div key={k}>
              <Label className="text-xs">{STATE_LABEL[k]}</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={initialState[k]}
                onChange={(e) =>
                  onChange({
                    ...value,
                    initialState: { ...initialState, [k]: Math.max(0, Math.min(100, parseInt(e.target.value || "0"))) },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Win / Fail conditions */}
      <div className="grid grid-cols-1 gap-2">
        <div className="rounded-xl border-2 border-success/40 p-3 space-y-2 bg-success/5">
          <div className="font-black text-sm text-success">شروط الفوز (حد أدنى — والمخاطر حد أقصى)</div>
          <div className="grid grid-cols-2 gap-2">
            {STATE_KEYS.map((k) => (
              <div key={k}>
                <Label className="text-xs">{STATE_LABEL[k]} {k === "risk" ? "(≤)" : "(≥)"}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={conditions.win[k] ?? ""}
                  placeholder="—"
                  onChange={(e) => {
                    const v = e.target.value === "" ? undefined : Math.max(0, Math.min(100, parseInt(e.target.value)));
                    onChange({ ...value, conditions: { ...conditions, win: { ...conditions.win, [k]: v } } });
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border-2 border-destructive/40 p-3 space-y-2 bg-destructive/5">
          <div className="font-black text-sm text-destructive">شروط الفشل (موارد/استقرار/تقدم ≤ — مخاطر ≥)</div>
          <div className="grid grid-cols-2 gap-2">
            {STATE_KEYS.map((k) => (
              <div key={k}>
                <Label className="text-xs">{STATE_LABEL[k]} {k === "risk" ? "(≥)" : "(≤)"}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={conditions.fail[k] ?? ""}
                  placeholder="—"
                  onChange={(e) => {
                    const v = e.target.value === "" ? undefined : Math.max(0, Math.min(100, parseInt(e.target.value)));
                    onChange({ ...value, conditions: { ...conditions, fail: { ...conditions.fail, [k]: v } } });
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t-2 border-border">
        <div className="flex items-center justify-between">
          <h5 className="font-black text-sm">المواقف والقرارات</h5>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...value, steps: [...value.steps, newSimulationStep()] })}
          >
            <Plus className="h-3 w-3" /> موقف
          </Button>
        </div>

        {value.steps.map((step, si) => (
          <div key={step.id} className="rounded-xl border-2 border-border p-3 space-y-2 bg-background">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs flex-1">الموقف {si + 1}</span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (value.steps.length === 1) return;
                  onChange({ ...value, steps: value.steps.filter((_, i) => i !== si) });
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Textarea
              rows={2}
              placeholder="نص الموقف الافتراضي..."
              value={step.prompt}
              onChange={(e) => updateStep(si, { prompt: e.target.value })}
            />

            <div className="space-y-2">
              {step.decisions.map((d, di) => {
                const eff = d.effects ?? {};
                return (
                  <div key={d.id} className="rounded-lg bg-muted/40 p-2 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder={`القرار ${di + 1}`}
                        value={d.text}
                        onChange={(e) => {
                          const ds = [...step.decisions];
                          ds[di] = { ...d, text: e.target.value };
                          updateStep(si, { decisions: ds });
                        }}
                      />
                      <Input
                        type="number"
                        className="w-20"
                        min={-10}
                        max={10}
                        value={d.impact}
                        onChange={(e) => {
                          const ds = [...step.decisions];
                          ds[di] = { ...d, impact: Math.max(-10, Math.min(10, parseInt(e.target.value || "0"))) };
                          updateStep(si, { decisions: ds });
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (step.decisions.length <= 2) return;
                          updateStep(si, { decisions: step.decisions.filter((_, i) => i !== di) });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                      {STATE_KEYS.map((k) => (
                        <div key={k}>
                          <Label className="text-[10px] text-muted-foreground">{STATE_LABEL[k]}</Label>
                          <Input
                            type="number"
                            min={-50}
                            max={50}
                            value={eff[k] ?? 0}
                            onChange={(e) => updateEffect(si, di, k, e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    <Textarea
                      rows={2}
                      placeholder="الشرح التعليمي لهذا القرار..."
                      value={d.rationale}
                      onChange={(e) => {
                        const ds = [...step.decisions];
                        ds[di] = { ...d, rationale: e.target.value };
                        updateStep(si, { decisions: ds });
                      }}
                    />
                  </div>
                );
              })}
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStep(si, { decisions: [...step.decisions, newSimulationDecision()] })}
              >
                <Plus className="h-3 w-3" /> قرار
              </Button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground">
        تأثير القرار يضبط متغيرات الحالة (-50..+50). الفوز/الفشل يعتمد على الحالة المتراكمة لا على إجابات صحيحة.
      </p>
    </div>
  );
}
