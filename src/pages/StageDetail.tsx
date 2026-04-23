import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Upload, Youtube, Sparkles, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type QType = "mcq" | "truefalse" | "text" | "file";
interface Question {
  id: string;
  type: QType;
  text: string;
  options?: { id: string; text: string }[] | null;
  correct_answer?: string | null;
  points: number;
}

export default function StageDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState<any>(null);
  const [previousSub, setPreviousSub] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, { value?: string; file?: File | null }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<null | { passed: boolean; score: number; maxScore: number; pending?: boolean }>(null);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const [{ data: st }, { data: sb }] = await Promise.all([
        supabase.from("stages").select("*").eq("id", id).single(),
        supabase.from("submissions").select("*").eq("stage_id", id).eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setStage(st);
      setPreviousSub(sb);
    })();
  }, [id, user]);

  const getQuestions = (st: any): Question[] => {
    const qs = (st?.questions as Question[]) || [];
    if (qs.length) return qs;
    // legacy fallback
    return [{
      id: "legacy",
      type: st.question_type,
      text: st.question_text,
      options: st.options,
      correct_answer: st.correct_answer,
      points: st.question_type === "mcq" || st.question_type === "truefalse" ? 1 : 10,
    }];
  };

  const handleSubmit = async () => {
    if (!stage || !user) return;
    const questions = getQuestions(stage);
    setSubmitting(true);
    try {
      const submittedAnswers: any[] = [];
      let autoScore = 0;
      let maxScore = 0;
      let hasManual = false;

      for (const q of questions) {
        maxScore += Number(q.points) || 0;
        const a = answers[q.id] || {};

        if (q.type === "mcq" || q.type === "truefalse") {
          if (!a.value) { toast.error(`أجب على جميع الأسئلة (سؤال ${questions.indexOf(q) + 1})`); return; }
          const correct = a.value === q.correct_answer;
          if (correct) autoScore += Number(q.points) || 0;
          submittedAnswers.push({ question_id: q.id, type: q.type, answer: a.value, correct, points: q.points, awarded: correct ? q.points : 0 });
        } else if (q.type === "text") {
          if (!a.value?.trim()) { toast.error(`أجب على جميع الأسئلة (سؤال ${questions.indexOf(q) + 1})`); return; }
          hasManual = true;
          submittedAnswers.push({ question_id: q.id, type: "text", answer: a.value.trim(), points: q.points, awarded: null });
        } else if (q.type === "file") {
          if (!a.file) { toast.error(`ارفع الملف للسؤال ${questions.indexOf(q) + 1}`); return; }
          const path = `${user.id}/${id}/${q.id}-${Date.now()}-${a.file.name}`;
          const { error: upErr } = await supabase.storage.from("submissions").upload(path, a.file);
          if (upErr) { toast.error("فشل رفع الملف"); return; }
          hasManual = true;
          submittedAnswers.push({ question_id: q.id, type: "file", file_url: path, points: q.points, awarded: null });
        }
      }

      let status: "pending" | "passed" | "failed" = "pending";
      let finalScore: number | null = null;

      if (!hasManual) {
        // fully auto-corrected
        finalScore = maxScore > 0 ? Math.round((autoScore / maxScore) * 100) : 0;
        status = finalScore >= (stage.passing_score || 60) ? "passed" : "failed";
      }

      const { error } = await supabase.from("submissions").insert({
        user_id: user.id,
        stage_id: id!,
        answers: submittedAnswers,
        score: finalScore,
        max_score: maxScore,
        status,
        answer_text: hasManual ? "متعدد الأسئلة - يحتاج تصحيح يدوي" : null,
      });
      if (error) { toast.error(error.message); return; }

      setSuccess({ passed: status === "passed", score: finalScore ?? autoScore, maxScore, pending: status === "pending" });
    } finally { setSubmitting(false); }
  };

  if (!stage) return <AppLayout><div className="h-64 surface-card animate-pulse" /></AppLayout>;

  const alreadyPassed = previousSub?.status === "passed" && !success;

  if (success || alreadyPassed) {
    const passed = success ? success.passed : true;
    const pending = success?.pending;
    return (
      <AppLayout>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="surface-card p-10 text-center max-w-2xl mx-auto">
          <div className={cn(
            "h-20 w-20 mx-auto rounded-full flex items-center justify-center mb-6 animate-gold-pulse",
            passed ? "bg-gradient-gold" : pending ? "bg-warning" : "bg-destructive"
          )}>
            {passed ? <CheckCircle2 className="h-10 w-10 text-primary-foreground" /> :
             pending ? <Sparkles className="h-10 w-10 text-warning-foreground" /> :
             <XCircle className="h-10 w-10 text-destructive-foreground" />}
          </div>
          <h2 className="text-3xl font-black mb-3">
            {passed ? "أحسنت! نجحت في المرحلة" : pending ? "تم استلام تسليمك" : "لم تنجح هذه المرة"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {passed ? `حصلت على ${success?.score ?? previousSub?.score}%. المرحلة التالية أصبحت متاحة الآن` :
             pending ? "سيتم تصحيح إجاباتك من قبل المدرّب وستظهر النتيجة في الملاحظات" :
             "هذه فرصة للتعلم. راجع إجاباتك وأعد المحاولة بثقة أكبر"}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild variant="gold" size="lg"><Link to="/stages">عودة للمراحل</Link></Button>
            {!passed && !pending && <Button onClick={() => { setSuccess(null); setAnswers({}); }} variant="outline" size="lg">إعادة المحاولة</Button>}
          </div>
        </motion.div>
      </AppLayout>
    );
  }

  const questions = getQuestions(stage);
  const totalPoints = questions.reduce((s, q) => s + (Number(q.points) || 0), 0);

  return (
    <AppLayout>
      <button onClick={() => navigate("/stages")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowRight className="h-4 w-4" /> العودة للمراحل
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface-card p-6 lg:p-8 mb-4">
        <div className="text-xs font-bold text-primary mb-2">المرحلة {stage.order_index}</div>
        <h1 className="text-3xl font-black mb-3">{stage.title}</h1>
        {stage.description && <p className="text-muted-foreground leading-relaxed">{stage.description}</p>}
        <div className="mt-3 text-xs font-bold text-muted-foreground">{questions.length} سؤال • {totalPoints} درجة • النجاح: {stage.passing_score}%</div>

        {stage.youtube_url && (
          <div className="mt-6">
            <div className="flex items-center gap-2 text-sm font-bold mb-3"><Youtube className="h-4 w-4 text-destructive" /> الفيديو التعليمي</div>
            <div className="relative pb-[56.25%] rounded-2xl overflow-hidden bg-black">
              <iframe src={stage.youtube_url.replace("watch?v=", "embed/")} className="absolute inset-0 w-full h-full" allowFullScreen />
            </div>
          </div>
        )}
      </motion.div>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const a = answers[q.id] || {};
          return (
            <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="surface-card p-6 lg:p-8">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-xs font-bold text-primary mb-1">السؤال {idx + 1} من {questions.length}</div>
                  <p className="text-base leading-relaxed font-bold">{q.text}</p>
                </div>
                <div className="shrink-0 px-3 py-1 rounded-full bg-gradient-gold text-primary-foreground text-xs font-black">{q.points} درجة</div>
              </div>

              {(q.type === "mcq" || q.type === "truefalse") && (
                <div className="space-y-2 mt-4">
                  {(q.options || []).map((opt) => (
                    <button key={opt.id} type="button" onClick={() => setAnswers({ ...answers, [q.id]: { value: opt.id } })}
                      className={cn(
                        "w-full text-right p-4 rounded-xl border-2 transition-all font-medium",
                        a.value === opt.id ? "border-primary bg-primary/10 shadow-gold-sm" : "border-border hover:border-primary/40 hover:bg-muted/50"
                      )}>
                      {opt.text}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "text" && (
                <div className="space-y-2 mt-4">
                  <Label>إجابتك</Label>
                  <Textarea value={a.value ?? ""} onChange={e => setAnswers({ ...answers, [q.id]: { value: e.target.value } })} rows={5} placeholder="اكتب إجابتك هنا..." className="resize-none" />
                </div>
              )}

              {q.type === "file" && (
                <div className="space-y-2 mt-4">
                  <Label>ارفع ملفك (PDF أو صورة)</Label>
                  <label className={cn("flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
                    a.file ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">{a.file?.name || "اضغط لاختيار ملف"}</span>
                    <input type="file" accept=".pdf,image/*" onChange={e => setAnswers({ ...answers, [q.id]: { file: e.target.files?.[0] ?? null } })} className="hidden" />
                  </label>
                </div>
              )}
            </motion.div>
          );
        })}

        <Button onClick={handleSubmit} disabled={submitting} variant="gold" size="lg" className="w-full">
          {submitting ? "جاري التسليم..." : "تسليم جميع الإجابات"}
        </Button>
      </div>
    </AppLayout>
  );
}
