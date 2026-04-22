import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Users, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Groups() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data: memberships } = await supabase.from("group_members").select("group_id").eq("user_id", user.id);
    const ids = memberships?.map(m => m.group_id) ?? [];
    if (ids.length === 0) { setGroups([]); setLoading(false); return; }
    const { data: gs } = await supabase.from("groups").select("*").in("id", ids).order("created_at", { ascending: false });
    setGroups(gs ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const leave = async (groupId: string) => {
    if (!user || !confirm("هل تريد مغادرة المجموعة؟")) return;
    const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    if (error) toast.error(error.message); else { toast.success("غادرت المجموعة"); load(); }
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">مجموعاتي</h1>
        <p className="text-muted-foreground">المجموعات التي أضافك إليها المدرّب</p>
      </div>

      {loading ? <div className="h-32 surface-card animate-pulse" /> :
       groups.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لم تتم إضافتك لأي مجموعة بعد</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {groups.map(g => (
            <div key={g.id} className="surface-card surface-card-hover p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-gold flex items-center justify-center"><Users className="h-5 w-5 text-primary-foreground"/></div>
                <button onClick={() => leave(g.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"><LogOut className="h-3 w-3"/>مغادرة</button>
              </div>
              <h3 className="font-black text-lg">{g.name}</h3>
              {g.description && <p className="text-sm text-muted-foreground mb-3">{g.description}</p>}
              <Button onClick={() => navigate(`/groups/${g.id}`)} variant="outline" size="sm" className="w-full mt-2">
                دخول المجموعة <ArrowLeft className="h-4 w-4"/>
              </Button>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
