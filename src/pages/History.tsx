import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export default function History() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("submissions")
        .select("*, stages(title, order_index, question_text, correct_answer, options)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setItems(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">المراحل السابقة</h1>
        <p className="text-muted-foreground">سجل كل تسليماتك مع الإجابة الصحيحة وتعليق المدرّب</p>
      </div>

      {loading ? <div className="h-32 surface-card animate-pulse" /> :
       items.length === 0 ? <div className="surface-card p-12 text-center text-muted-foreground">لا توجد تسليمات سابقة بعد</div> :
       <div className="space-y-3">
         {items.map((s, i) => {
           const stage = s.stages;
           const opts = (stage?.options as any[]) || [];
           const userOpt = opts.find(o => o.id === s.answer_text);
           const correctOpt = opts.find(o => o.id === stage?.correct_answer);
           return (
             <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
               className="surface-card p-5">
               <div className="flex items-start justify-between gap-3 mb-3">
                 <div className="flex-1 min-w-0">
                   <div className="text-xs font-bold text-primary mb-1">المرحلة {stage?.order_index}</div>
                   <h3 className="font-black">{stage?.title}</h3>
                 </div>
                 {s.status === "passed" && <span className="inline-flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-full"><CheckCircle2 className="h-3 w-3"/>{s.score}%</span>}
                 {s.status === "failed" && <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-full"><XCircle className="h-3 w-3"/>راسب</span>}
                 {s.status === "pending" && <span className="inline-flex items-center gap-1 text-xs font-bold text-warning bg-warning/10 px-2 py-1 rounded-full"><Clock className="h-3 w-3"/>مراجعة</span>}
               </div>

               <div className="grid md:grid-cols-2 gap-3 text-sm">
                 <div className="bg-muted/40 rounded-xl p-3">
                   <div className="text-xs font-bold text-muted-foreground mb-1">إجابتك</div>
                   <div>{userOpt?.text || s.answer_text || (s.file_url ? "ملف مُرفق" : "—")}</div>
                 </div>
                 {correctOpt && (
                   <div className="bg-success/10 rounded-xl p-3">
                     <div className="text-xs font-bold text-success mb-1">الإجابة الصحيحة</div>
                     <div>{correctOpt.text}</div>
                   </div>
                 )}
               </div>

               {s.feedback && (
                 <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                   <div className="text-xs font-bold text-primary mb-1">ملاحظة المدرّب</div>
                   <p className="text-sm">{s.feedback}</p>
                 </div>
               )}
             </motion.div>
           );
         })}
       </div>
      }
    </AppLayout>
  );
}
