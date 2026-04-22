import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Lock, CheckCircle2, XCircle, Clock, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Stage { id: string; order_index: number; title: string; description: string | null; }
interface SubMap { [stageId: string]: { status: string; score: number | null } }

export default function Stages() {
  const { user } = useAuth();
  const [stages, setStages] = useState<Stage[]>([]);
  const [subs, setSubs] = useState<SubMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: st }, { data: sb }] = await Promise.all([
        supabase.from("stages").select("id, order_index, title, description").eq("is_published", true).order("order_index"),
        supabase.from("submissions").select("stage_id, status, score").eq("user_id", user.id),
      ]);
      setStages(st ?? []);
      const map: SubMap = {};
      (sb ?? []).forEach(s => {
        // keep latest by status priority: passed > pending > failed
        const cur = map[s.stage_id];
        if (!cur || (s.status === "passed") || (s.status === "pending" && cur.status === "failed")) {
          map[s.stage_id] = { status: s.status, score: s.score };
        }
      });
      setSubs(map);
      setLoading(false);
    })();
  }, [user]);

  const isUnlocked = (idx: number) => {
    if (idx === 0) return true;
    const prev = stages[idx - 1];
    return prev && subs[prev.id]?.status === "passed";
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">مراحل المسار</h1>
        <p className="text-muted-foreground">اجتز كل مرحلة بدرجة 60% أو أعلى لفتح المرحلة التالية</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 surface-card animate-pulse" />)}</div>
      ) : stages.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <div className="text-muted-foreground">لا توجد مراحل منشورة بعد</div>
        </div>
      ) : (
        <div className="relative">
          {/* timeline line */}
          <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
          <div className="space-y-4">
            {stages.map((stage, idx) => {
              const sub = subs[stage.id];
              const unlocked = isUnlocked(idx);
              const status = sub?.status;

              return (
                <motion.div key={stage.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  className="relative md:pr-16">
                  {/* node */}
                  <div className={cn(
                    "absolute right-3 top-6 h-6 w-6 rounded-full border-4 border-background hidden md:flex items-center justify-center text-[10px] font-black",
                    status === "passed" ? "bg-gradient-gold animate-gold-pulse text-primary-foreground" :
                    status === "failed" ? "bg-destructive text-destructive-foreground" :
                    status === "pending" ? "bg-warning text-warning-foreground" :
                    unlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>{idx + 1}</div>

                  <div className={cn(
                    "surface-card p-5 lg:p-6 transition-all",
                    !unlocked && "opacity-50",
                    unlocked && "surface-card-hover",
                    status === "passed" && "border-primary/40 shadow-gold-sm"
                  )}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-primary">المرحلة {idx + 1}</span>
                          {status === "passed" && <span className="inline-flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full"><CheckCircle2 className="h-3 w-3"/>ناجح • {sub?.score}%</span>}
                          {status === "failed" && <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full"><XCircle className="h-3 w-3"/>راسب • أعد المحاولة</span>}
                          {status === "pending" && <span className="inline-flex items-center gap-1 text-xs font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full"><Clock className="h-3 w-3"/>قيد المراجعة</span>}
                          {!unlocked && <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full"><Lock className="h-3 w-3"/>مقفلة</span>}
                        </div>
                        <h3 className="font-black text-lg mb-1">{stage.title}</h3>
                        {stage.description && <p className="text-sm text-muted-foreground line-clamp-2">{stage.description}</p>}
                      </div>

                      {unlocked && status !== "pending" && (
                        <Link to={`/stages/${stage.id}`} className="shrink-0 inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 h-11 rounded-xl font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-gold-sm">
                          {status === "passed" ? "عرض" : status === "failed" ? "إعادة" : "ابدأ"}
                          <ArrowLeft className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
