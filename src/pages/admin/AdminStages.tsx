import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Edit, GripVertical } from "lucide-react";
import SimulationEditor from "@/features/simulation/SimulationEditor";
import { newSimulationQuestion, SimulationQuestion, detectRealismViolations } from "@/features/simulation/types";

type QType = "mcq" | "truefalse" | "text" | "file" | "simulation";
interface Question {
  id: string;
  type: QType;
  text: string;
  options?: { id: string; text: string }[] | null;
  correct_answer?: string | null;
  points: number;
  // simulation extension fields (only used when type === "simulation")
  scenario?: string;
  steps?: SimulationQuestion["steps"];
}

const newQuestion = (type: QType = "mcq"): Question => {
  if (type === "simulation") {
    return newSimulationQuestion() as unknown as Question;
  }
  return {
    id: crypto.randomUUID(),
    type,
    text: "",
    options: type === "mcq"
      ? [{ id: "a", text: "" }, { id: "b", text: "" }]
      : type === "truefalse"
        ? [{ id: "true", text: "صح" }, { id: "false", text: "خطأ" }]
        : null,
    correct_answer: type === "mcq" ? "a" : type === "truefalse" ? "true" : null,
    points: type === "mcq" || type === "truefalse" ? 1 : 10,
  };
};

export default function AdminStages() {
  const [stages, setStages] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const blank = () => ({
    order_index: (stages.at(-1)?.order_index ?? 0) + 1,
    title: "", description: "", youtube_url: "",
    passing_score: 60, is_published: true,
    questions: [newQuestion("mcq")] as Question[],
    // legacy required fields filled with placeholders
    question_type: "mcq", question_text: "", options: null, correct_answer: null,
  });

  const load = async () => {
    const { data } = await supabase.from("stages").select("*").order("order_index");
    setStages(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const totalPoints = (qs: Question[]) => qs.reduce((s, q) => s + (Number(q.points) || 0), 0);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return toast.error("أدخل عنوان المرحلة");
    const qs: Question[] = editing.questions || [];
    if (qs.length === 0) return toast.error("أضف سؤالاً واحداً على الأقل");
    for (const q of qs) {
      if (!q.text.trim()) return toast.error("كل سؤال يحتاج نصاً");
      if (!q.points || q.points < 1) return toast.error("درجة كل سؤال يجب أن تكون 1 على الأقل");
      if (q.type === "mcq") {
        if (!q.options || q.options.length < 2) return toast.error("سؤال الاختيار يحتاج خيارين على الأقل");
        if (!q.correct_answer) return toast.error("حدد الإجابة الصحيحة لكل سؤال اختيار");
      }
      if (q.type === "simulation") {
        const sim = q as unknown as SimulationQuestion;
        if (!sim.scenario?.trim()) return toast.error("أضف وصفاً للسيناريو الافتراضي");
        if (!sim.steps || sim.steps.length === 0) return toast.error("أضف موقفاً واحداً على الأقل");
        for (const s of sim.steps) {
          if (!s.prompt.trim()) return toast.error("كل موقف يحتاج نصاً");
          if (s.decisions.length < 2) return toast.error("كل موقف يحتاج قرارين على الأقل");
          if (s.decisions.some((d) => !d.text.trim())) return toast.error("اكتب نص كل قرار");
        }
        const v = [
          ...detectRealismViolations(sim.scenario),
          ...detectRealismViolations(sim.text),
          ...sim.steps.flatMap((s) => [
            ...detectRealismViolations(s.prompt),
            ...s.decisions.flatMap((d) => [...detectRealismViolations(d.text), ...detectRealismViolations(d.rationale)]),
          ]),
        ];
        if (v.length) return toast.error("يحتوي السيناريو على مصطلحات واقعية محظورة: " + [...new Set(v)].join("، "));
      }
    }

    // Sync legacy fields with first non-simulation question for backward compatibility.
    // Simulation is stored only inside `questions` JSONB; legacy mirror falls back to "text".
    const first = qs[0];
    const isSim = first.type === "simulation";
    const payload: any = {
      order_index: editing.order_index,
      title: editing.title,
      description: editing.description,
      youtube_url: editing.youtube_url || null,
      passing_score: editing.passing_score,
      is_published: editing.is_published,
      questions: qs,
      question_type: isSim ? "text" : first.type,
      question_text: first.text || "محاكاة تعليمية",
      options: isSim ? null : first.options,
      correct_answer: isSim ? null : first.correct_answer,
    };

    const { error } = editing.id
      ? await supabase.from("stages").update(payload).eq("id", editing.id)
      : await supabase.from("stages").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف المرحلة؟ سيتم حذف جميع التسليمات المرتبطة.")) return;
    await supabase.from("stages").delete().eq("id", id);
    load();
  };

  const updateQ = (idx: number, patch: Partial<Question>) => {
    const qs = [...editing.questions];
    qs[idx] = { ...qs[idx], ...patch };
    setEditing({ ...editing, questions: qs });
  };

  const changeType = (idx: number, type: QType) => {
    const fresh = newQuestion(type);
    const qs = [...editing.questions];
    qs[idx] = { ...fresh, id: qs[idx].id, text: qs[idx].text };
    setEditing({ ...editing, questions: qs });
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-black mb-2">إدارة المراحل</h1>
          <p className="text-muted-foreground">إنشاء وتعديل مراحل المسار</p>
        </div>
        <Button variant="gold" onClick={() => setEditing(blank())}><Plus className="h-4 w-4"/>مرحلة جديدة</Button>
      </div>

      <div className="space-y-2">
        {stages.map(s => {
          const qs: Question[] = (s.questions as any[])?.length ? s.questions : [];
          const total = totalPoints(qs);
          return (
            <div key={s.id} className="surface-card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-gold flex items-center justify-center font-black text-primary-foreground text-sm">{s.order_index}</div>
              <div className="flex-1 min-w-0">
                <div className="font-black truncate">{s.title}</div>
                <div className="text-xs text-muted-foreground">{qs.length || 1} سؤال • {total || 1} درجة • نجاح: {s.passing_score}%</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setEditing({ ...s, questions: qs.length ? qs : [newQuestion(s.question_type)] })}><Edit className="h-4 w-4"/></Button>
              <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
            </div>
          );
        })}
        {stages.length === 0 && <div className="surface-card p-8 text-center text-muted-foreground">لا توجد مراحل بعد. ابدأ بإضافة الأولى</div>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4" onClick={() => setEditing(null)}>
          <div className="bg-card w-full lg:max-w-3xl rounded-t-3xl lg:rounded-3xl max-h-[92vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <h3 className="font-black text-xl">{editing.id ? "تعديل المرحلة" : "مرحلة جديدة"}</h3>

              <div className="grid grid-cols-2 gap-3">
                <div><Label>الترتيب</Label><Input type="number" value={editing.order_index} onChange={e => setEditing({ ...editing, order_index: parseInt(e.target.value || "1") })}/></div>
                <div><Label>درجة النجاح %</Label><Input type="number" value={editing.passing_score} onChange={e => setEditing({ ...editing, passing_score: parseInt(e.target.value || "60") })}/></div>
              </div>
              <div><Label>العنوان</Label><Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}/></div>
              <div><Label>الوصف</Label><Textarea rows={2} value={editing.description ?? ""} onChange={e => setEditing({ ...editing, description: e.target.value })}/></div>
              <div><Label>رابط يوتيوب (اختياري)</Label><Input dir="ltr" value={editing.youtube_url ?? ""} onChange={e => setEditing({ ...editing, youtube_url: e.target.value })} placeholder="https://youtube.com/watch?v=..."/></div>

              <div className="flex items-center justify-between pt-2 border-t-2 border-border">
                <div>
                  <h4 className="font-black">الأسئلة</h4>
                  <p className="text-xs text-muted-foreground">المجموع: {totalPoints(editing.questions)} درجة</p>
                </div>
              </div>

              {editing.questions.map((q: Question, idx: number) => (
                <div key={q.id} className="rounded-2xl border-2 border-border p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground"/>
                    <span className="font-black text-sm flex-1">سؤال {idx + 1}</span>
                    <Button size="icon" variant="ghost" onClick={() => {
                      if (editing.questions.length === 1) return toast.error("يجب وجود سؤال واحد على الأقل");
                      setEditing({ ...editing, questions: editing.questions.filter((_: any, i: number) => i !== idx) });
                    }}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>النوع</Label>
                      <select value={q.type} onChange={e => changeType(idx, e.target.value as QType)} className="w-full h-11 rounded-xl border-2 border-border bg-background px-3 mt-1.5">
                        <option value="mcq">اختيار من متعدد</option>
                        <option value="truefalse">صح/خطأ</option>
                        <option value="text">نص مفتوح</option>
                        <option value="file">رفع ملف</option>
                      </select>
                    </div>
                    <div>
                      <Label>الدرجة</Label>
                      <Input
                        type="number" min={1}
                        value={q.points}
                        disabled={q.type === "mcq" || q.type === "truefalse"}
                        onChange={e => updateQ(idx, { points: parseInt(e.target.value || "1") })}
                      />
                      {(q.type === "mcq" || q.type === "truefalse") && (
                        <p className="text-[10px] text-muted-foreground mt-1">ثابت = 1 درجة</p>
                      )}
                    </div>
                  </div>

                  <div><Label>نص السؤال</Label><Textarea rows={2} value={q.text} onChange={e => updateQ(idx, { text: e.target.value })}/></div>

                  {q.type === "mcq" && (
                    <div className="space-y-2">
                      <Label>الخيارات (حدد الإجابة الصحيحة)</Label>
                      {(q.options || []).map((opt, oi) => (
                        <div key={oi} className="flex gap-2 items-center">
                          <input type="radio" name={`correct-${q.id}`} checked={q.correct_answer === opt.id} onChange={() => updateQ(idx, { correct_answer: opt.id })}/>
                          <Input value={opt.text} onChange={e => {
                            const o = [...(q.options || [])];
                            o[oi] = { ...opt, text: e.target.value };
                            updateQ(idx, { options: o });
                          }} placeholder={`الخيار ${oi + 1}`}/>
                          <Button size="icon" variant="ghost" onClick={() => {
                            if ((q.options?.length || 0) <= 2) return toast.error("خياران على الأقل");
                            updateQ(idx, { options: (q.options || []).filter((_, i) => i !== oi) });
                          }}><Trash2 className="h-4 w-4"/></Button>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={() => {
                        const id = String.fromCharCode(97 + (q.options?.length || 0));
                        updateQ(idx, { options: [...(q.options || []), { id, text: "" }] });
                      }}><Plus className="h-3 w-3"/>خيار</Button>
                    </div>
                  )}

                  {q.type === "truefalse" && (
                    <div>
                      <Label>الإجابة الصحيحة</Label>
                      <select value={q.correct_answer ?? "true"} onChange={e => updateQ(idx, { correct_answer: e.target.value })} className="w-full h-11 rounded-xl border-2 border-border bg-background px-3 mt-1.5">
                        <option value="true">صح</option>
                        <option value="false">خطأ</option>
                      </select>
                    </div>
                  )}

                  {(q.type === "text" || q.type === "file") && (
                    <p className="text-xs text-muted-foreground">سيتم تصحيح هذا السؤال يدوياً من قبل المدرّب</p>
                  )}
                </div>
              ))}

              <Button variant="outline" onClick={() => setEditing({ ...editing, questions: [...editing.questions, newQuestion("mcq")] })} className="w-full">
                <Plus className="h-4 w-4"/>إضافة سؤال
              </Button>

              <div className="flex gap-2 pt-2 sticky bottom-0 bg-card pb-1">
                <Button variant="gold" onClick={save} className="flex-1">حفظ المرحلة</Button>
                <Button variant="ghost" onClick={() => setEditing(null)}>إلغاء</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
