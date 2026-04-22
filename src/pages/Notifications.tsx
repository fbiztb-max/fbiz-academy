import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    load();
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-2">الإشعارات</h1>
          <p className="text-muted-foreground">آخر التحديثات الخاصة بك</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="h-4 w-4"/>تعليم الكل كمقروء</Button>
      </div>

      {items.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(n => (
            <button key={n.id} onClick={async () => {
              await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
              load();
              if (n.link) navigate(n.link);
            }} className={`w-full text-right surface-card p-4 surface-card-hover ${!n.is_read ? "border-primary/40" : ""}`}>
              <div className="flex items-start gap-3">
                <div className={`h-2 w-2 mt-2 rounded-full ${n.is_read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                <div className="flex-1">
                  <div className="font-bold text-sm">{n.title}</div>
                  {n.body && <div className="text-sm text-muted-foreground mt-1">{n.body}</div>}
                  <div className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { locale: arSA, addSuffix: true })}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
