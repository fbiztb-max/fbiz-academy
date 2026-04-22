import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare } from "lucide-react";

export default function Feedback() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("submissions")
        .select("id, feedback, score, status, reviewed_at, stages(title, order_index)")
        .eq("user_id", user.id)
        .not("feedback", "is", null)
        .order("reviewed_at", { ascending: false });
      setItems(data ?? []);
    })();
  }, [user]);

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">ملاحظات المدرّب</h1>
        <p className="text-muted-foreground">كل الملاحظات الموجّهة إليك من المدرّب</p>
      </div>

      {items.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لا توجد ملاحظات بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(s => (
            <div key={s.id} className="surface-card p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs font-bold text-primary">المرحلة {s.stages?.order_index}</div>
                  <h3 className="font-black">{s.stages?.title}</h3>
                </div>
                <div className="text-sm font-bold text-foreground">{s.score}%</div>
              </div>
              <p className="text-sm leading-relaxed bg-muted/40 rounded-xl p-3">{s.feedback}</p>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
