import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Layers, CheckCircle2, TrendingUp, Trophy, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({ total: 0, passed: 0, avg: 0, rank: 0, nextStage: null as any, pendingCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: stages }, { data: subs }, { data: allPassed }] = await Promise.all([
        supabase.from("stages").select("id, title, order_index").eq("is_published", true).order("order_index"),
        supabase.from("submissions").select("stage_id, status, score").eq("user_id", user.id),
        supabase.from("submissions").select("user_id, score").eq("status", "passed"),
      ]);

      const passedSubs = (subs ?? []).filter(s => s.status === "passed");
      const passedStageIds = new Set(passedSubs.map(s => s.stage_id));
      const avg = passedSubs.length ? Math.round(passedSubs.reduce((a, s) => a + (s.score ?? 0), 0) / passedSubs.length) : 0;

      // rank by passed-count desc, ties broken by avg score
      const userScores = new Map<string, { count: number; sum: number }>();
      (allPassed ?? []).forEach(p => {
        const cur = userScores.get(p.user_id) ?? { count: 0, sum: 0 };
        cur.count++; cur.sum += p.score ?? 0;
        userScores.set(p.user_id, cur);
      });
      const sorted = Array.from(userScores.entries()).map(([uid, v]) => ({ uid, count: v.count, avg: v.count ? v.sum / v.count : 0 })).sort((a, b) => b.count - a.count || b.avg - a.avg);
      const rank = sorted.findIndex(s => s.uid === user.id) + 1;

      const nextStage = (stages ?? []).find(s => !passedStageIds.has(s.id)) ?? null;
      const pendingCount = (subs ?? []).filter(s => s.status === "pending").length;

      setStats({
        total: stages?.length ?? 0,
        passed: passedStageIds.size,
        avg,
        rank: rank || sorted.length + 1,
        nextStage,
        pendingCount,
      });
      setLoading(false);
    })();
  }, [user]);

  const progress = stats.total ? Math.round((stats.passed / stats.total) * 100) : 0;
  const remaining = stats.total - stats.passed;

  const kpis = [
    { label: "إجمالي المراحل", value: stats.total, icon: Layers, color: "from-primary to-primary-glow" },
    { label: "المراحل المكتملة", value: stats.passed, icon: CheckCircle2, color: "from-success to-success" },
    { label: "متوسط الأداء", value: `${stats.avg}%`, icon: TrendingUp, color: "from-primary to-primary-glow" },
    { label: "ترتيبك", value: `#${stats.rank}`, icon: Trophy, color: "from-primary to-primary-glow" },
  ];

  return (
    <AppLayout>
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden surface-card p-6 lg:p-10 mb-6 gradient-obsidian text-white noise-overlay">
        <div className="absolute inset-0 bg-gradient-radial-gold" />
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-primary text-sm font-bold mb-3">
            <Sparkles className="h-4 w-4" /> أهلاً بك في رحلتك
          </div>
          <h1 className="text-3xl lg:text-4xl font-black mb-2">مرحبًا، {profile?.full_name || "متدرب"} 👋</h1>
          <p className="text-white/70 text-base lg:text-lg max-w-2xl">
            {stats.passed === 0 ? "ابدأ المرحلة الأولى الآن واصنع أول إنجاز" :
             progress === 100 ? "أنهيت كل المراحل المتاحة. أحسنت!" :
             `أنجزت ${stats.passed} من ${stats.total} مراحل. تبقّى ${remaining} للوصول للقمة`}
          </p>

          {stats.total > 0 && (
            <div className="mt-6 max-w-xl">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/80">تقدمك العام</span>
                <span className="font-black text-primary">{progress}%</span>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-gradient-gold shadow-gold-sm"
                />
              </div>
            </div>
          )}

          {stats.nextStage && (
            <Button asChild variant="gold" size="lg" className="mt-6">
              <Link to="/stages">
                {stats.passed === 0 ? "ابدأ أولى المراحل" : "تابع المرحلة التالية"}
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="surface-card surface-card-hover p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`h-10 w-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold-sm`}>
                <k.icon className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-foreground">{loading ? "—" : k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Link to="/stages" className="surface-card surface-card-hover p-6 group">
          <Layers className="h-7 w-7 text-primary mb-3" />
          <h3 className="font-black text-lg mb-1">المراحل المتاحة</h3>
          <p className="text-sm text-muted-foreground">انتقل بين المراحل وأنجز التقييمات بترتيب منظم</p>
        </Link>
        <Link to="/feedback" className="surface-card surface-card-hover p-6 group">
          <Sparkles className="h-7 w-7 text-primary mb-3" />
          <h3 className="font-black text-lg mb-1">ملاحظات المدرّب</h3>
          <p className="text-sm text-muted-foreground">{stats.pendingCount > 0 ? `${stats.pendingCount} تسليم قيد المراجعة` : "اقرأ الملاحظات بعد كل تصحيح"}</p>
        </Link>
        <Link to="/news" className="surface-card surface-card-hover p-6 group">
          <Trophy className="h-7 w-7 text-primary mb-3" />
          <h3 className="font-black text-lg mb-1">آخر الأخبار</h3>
          <p className="text-sm text-muted-foreground">تابع تحديثات المنصة والإعلانات الرسمية</p>
        </Link>
      </div>
    </AppLayout>
  );
}
