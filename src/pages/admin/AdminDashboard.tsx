import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Layers, FileCheck, Users, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, stages: 0, pending: 0, news: 0 });
  useEffect(() => {
    (async () => {
      const [u, s, p, n] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("stages").select("id", { count: "exact", head: true }),
        supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("news").select("id", { count: "exact", head: true }),
      ]);
      setStats({ users: u.count ?? 0, stages: s.count ?? 0, pending: p.count ?? 0, news: n.count ?? 0 });
    })();
  }, []);

  const cards = [
    { l: "المستخدمون", v: stats.users, i: Users, to: "/admin/users" },
    { l: "المراحل", v: stats.stages, i: Layers, to: "/admin/stages" },
    { l: "تسليمات قيد المراجعة", v: stats.pending, i: FileCheck, to: "/admin/review" },
    { l: "أخبار منشورة", v: stats.news, i: Newspaper, to: "/admin/news" },
  ];
  return (
    <AppLayout>
      <h1 className="text-3xl font-black mb-2">لوحة الأدمن</h1>
      <p className="text-muted-foreground mb-8">إدارة شاملة للمنصة</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Link key={c.l} to={c.to} className="surface-card surface-card-hover p-5">
            <div className="h-10 w-10 rounded-xl bg-gradient-gold flex items-center justify-center mb-3"><c.i className="h-5 w-5 text-primary-foreground"/></div>
            <div className="text-3xl font-black">{c.v}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.l}</div>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
