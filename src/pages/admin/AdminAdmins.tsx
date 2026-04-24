import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, ShieldOff, Crown, UserPlus, Search, AlertCircle } from "lucide-react";
import { Navigate } from "react-router-dom";
import { playSound } from "@/hooks/useSound";

const OWNER_EMAIL = "ferrrras2356@gmail.com";

interface AdminRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  serial_id: number;
  avatar_url: string | null;
  is_owner: boolean;
}

export default function AdminAdmins() {
  const { user, profile } = useAuth();
  const isOwner = profile?.email === OWNER_EMAIL;
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [q, setQ] = useState("");
  const [serial, setSerial] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    const ids = roles?.map(r => r.user_id) ?? [];
    if (!ids.length) { setAdmins([]); return; }
    const { data: profs } = await supabase.from("profiles").select("user_id, full_name, email, serial_id, avatar_url").in("user_id", ids);
    setAdmins((profs ?? []).map(p => ({ ...p, is_owner: p.email === OWNER_EMAIL })) as AdminRow[]);
  };
  useEffect(() => { load(); }, []);

  if (!isOwner) return <Navigate to="/admin" replace />;

  const promote = async () => {
    const sid = parseInt(serial.trim());
    if (!sid && sid !== 0) return toast.error("أدخل رقم تعريفي صحيح");
    setBusy(true);
    const { data: p } = await supabase.from("profiles").select("user_id, full_name").eq("serial_id", sid).maybeSingle();
    if (!p) { setBusy(false); return toast.error("لا يوجد مستخدم بهذا الرقم"); }
    const { data: ex } = await supabase.from("user_roles").select("id").eq("user_id", p.user_id).eq("role", "admin").maybeSingle();
    if (ex) { setBusy(false); return toast.info("هذا المستخدم أدمن بالفعل"); }
    const { error } = await supabase.from("user_roles").insert({ user_id: p.user_id, role: "admin" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`تم ترقية ${p.full_name} إلى أدمن`);
    playSound("success");
    setSerial("");
    load();
  };

  const demote = async (a: AdminRow) => {
    if (a.is_owner) return toast.error("لا يمكن إزالة المالك");
    if (!confirm(`إزالة صلاحية الأدمن من ${a.full_name}؟`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", a.user_id).eq("role", "admin");
    if (error) return toast.error(error.message);
    toast.success("تم سحب الصلاحية");
    load();
  };

  const filtered = q.trim()
    ? admins.filter(a => String(a.serial_id).includes(q) || (a.full_name ?? "").includes(q) || (a.email ?? "").includes(q))
    : admins;

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-2">
        <Crown className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-black">إدارة المشرفين (المالك فقط)</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">أنت المالك الوحيد القادر على إضافة أو سحب صلاحيات الأدمن.</p>

      <div className="surface-card p-5 mb-6">
        <div className="flex items-start gap-2 text-xs text-muted-foreground mb-3">
          <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>الأدمن الفرعي يحصل على كل صلاحياتك ما عدا التحكم بحسابات الأدمن (هذه الصفحة).</span>
        </div>
        <Label>ترقية مستخدم بالرقم التعريفي #</Label>
        <div className="flex gap-2 mt-1.5">
          <Input value={serial} onChange={e => setSerial(e.target.value)} placeholder="مثلاً 12" type="number" className="h-11" />
          <Button onClick={promote} variant="gold" disabled={busy} className="h-11">
            <UserPlus className="h-4 w-4" /> ترقية
          </Button>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث في الأدمن" className="pr-9 h-11" />
      </div>

      <div className="space-y-2">
        {filtered.map(a => (
          <div key={a.user_id} className="surface-card p-3 flex items-center gap-3">
            {a.avatar_url ? <img src={a.avatar_url} className="h-10 w-10 rounded-full object-cover"/> :
              <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center font-black text-primary-foreground">{a.full_name?.[0] || "؟"}</div>}
            <div className="flex-1 min-w-0">
              <div className="font-bold flex items-center gap-1.5">
                {a.full_name}
                {a.is_owner && <Crown className="h-3.5 w-3.5 text-primary" />}
              </div>
              <div className="text-xs text-muted-foreground truncate">#{a.serial_id} · {a.email}</div>
            </div>
            {a.is_owner ? (
              <span className="text-[10px] font-black bg-primary/15 text-primary px-2 py-1 rounded-full">المالك</span>
            ) : (
              <Button variant="outline" size="sm" onClick={() => demote(a)} className="text-destructive">
                <ShieldOff className="h-3.5 w-3.5" /> سحب
              </Button>
            )}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
