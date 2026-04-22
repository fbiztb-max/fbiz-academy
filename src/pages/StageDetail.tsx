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

export default function StageDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState<any>(null);
  const [previousSub, setPreviousSub] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<null | { passed: boolean; score: number; pending?: boolean }>(null);

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

  const handleSubmit = async () => {
    if (!stage || !user) return;
    setSubmitting(true);
    try {
      let fileUrl: string | null = null;

      if (stage.question_type === "file") {
        if (!file) { toast.error("يجب رفع ملف"); return; }
        const path = `${user.id}/${id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("submissions").upload(path, file);
        if (upErr) { toast.error("فشل رفع الملف"); return; }
        fileUrl = path;
      }

      let answerText = "";
      if (stage.question_type === "mcq" || stage.question_type === "truefalse") {
        if (!selectedOption) { toast.error("اختر إجابة"); return; }
        answerText = selectedOption;
      } else if (stage.question_type === "text") {
        if (!answer.trim()) { toast.error("اكتب إجابتك"); return; }
        answerText = answer.trim();
      }

      // Auto-correction
      let status: "pending" | "passed" | "failed" = "pending";
      let score: number | null = null;

      if (stage.question_type === "mcq" || stage.question_type === "truefalse") {
        const correct = stage.correct_answer && answerText === stage.correct_answer;
        score = correct ? 100 : 0;
        status = correct ? "passed" : "failed";
      }

      const { error } = await supabase.from("submissions").insert({
        user_id: user.id, stage_id: id!, answer_text: answerText, file_url: fileUrl, score, status,
      });
      if (error) { toast.error(error.message); return; }

      setSuccess({ passed: status === "passed", score: score ?? 0, pending: status === "pending" });
    } finally { setSubmitting(false); }
  };

  if (!stage) return <AppLayout><div className="h-64 surface-card animate-pulse" /></AppLayout>;

  // already passed view
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
             pending ? "سيتم تصحيح إجابتك من قبل المدرّب وستظهر النتيجة في الملاحظات" :
             "هذه فرصة للتعلم. راجع الإجابة وأعد المحاولة بثقة أكبر"}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button asChild variant="gold" size="lg"><Link to="/stages">عودة للمراحل</Link></Button>
            {!passed && !pending && <Button onClick={() => { setSuccess(null); setAnswer(""); setSelectedOption(""); setFile(null); }} variant="outline" size="lg">إعادة المحاولة</Button>}
          </div>
        </motion.div>
      </AppLayout>
    );
  }

  const options = (stage.options as any[]) || [];

  return (
    <AppLayout>
      <button onClick={() => navigate("/stages")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowRight className="h-4 w-4" /> العودة للمراحل
      </button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface-card p-6 lg:p-8 mb-4">
        <div className="text-xs font-bold text-primary mb-2">المرحلة {stage.order_index}</div>
        <h1 className="text-3xl font-black mb-3">{stage.title}</h1>
        {stage.description && <p className="text-muted-foreground leading-relaxed">{stage.description}</p>}

        {stage.youtube_url && (
          <div className="mt-6">
            <div className="flex items-center gap-2 text-sm font-bold mb-3"><Youtube className="h-4 w-4 text-destructive" /> الفيديو التعليمي</div>
            <div className="relative pb-[56.25%] rounded-2xl overflow-hidden bg-black">
              <iframe src={stage.youtube_url.replace("watch?v=", "embed/")} className="absolute inset-0 w-full h-full" allowFullScreen />
            </div>
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="surface-card p-6 lg:p-8">
        <h2 className="font-black text-xl mb-2">السؤال</h2>
        <p className="text-base mb-6 leading-relaxed">{stage.question_text}</p>

        {(stage.question_type === "mcq" || stage.question_type === "truefalse") && (
          <div className="space-y-2">
            {options.map((opt: any) => (
              <button key={opt.id} type="button" onClick={() => setSelectedOption(opt.id)}
                className={cn(
                  "w-full text-right p-4 rounded-xl border-2 transition-all font-medium",
                  selectedOption === opt.id ? "border-primary bg-primary/10 shadow-gold-sm" : "border-border hover:border-primary/40 hover:bg-muted/50"
                )}>
                {opt.text}
              </button>
            ))}
          </div>
        )}

        {stage.question_type === "text" && (
          <div className="space-y-2">
            <Label>إجابتك</Label>
            <Textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={6} placeholder="اكتب إجابتك هنا..." className="resize-none" />
            <p className="text-xs text-muted-foreground">سيتم تصحيح إجابتك يدوياً من قبل المدرّب</p>
          </div>
        )}

        {stage.question_type === "file" && (
          <div className="space-y-2">
            <Label>ارفع ملفك (PDF أو صورة)</Label>
            <label className={cn("flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
              file ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")}>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium">{file ? file.name : "اضغط لاختيار ملف"}</span>
              <input type="file" accept=".pdf,image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} className="hidden" />
            </label>
          </div>
        )}

        <Button onClick={handleSubmit} disabled={submitting} variant="gold" size="lg" className="w-full mt-6">
          {submitting ? "جاري التسليم..." : "تسليم الإجابة"}
        </Button>
      </motion.div>
    </AppLayout>
  );
}
