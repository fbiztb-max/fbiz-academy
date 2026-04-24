import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Crown, ChevronLeft } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  useEffect(() => {
    (async () => {
      const [{ data: profs }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("serial_id"),
        supabase.from("user_roles").select("user_id").eq("role", "admin"),
      ]);
      setUsers(profs ?? []);
      setAdminIds(new Set((roles ?? []).map((r: any) => r.user_id)));
    })();
  }, []);
  const filtered = q.trim() ? users.filter(u =>
    String(u.serial_id).includes(q) || u.full_name?.includes(q) || u.email?.includes(q)
  ) : users;
  return (
    <AppLayout>
      <h1 className="text-3xl font-black mb-2">المستخدمون</h1>
      <p className="text-muted-foreground mb-6">اضغط على أي مستخدم لفتح بروفايله ورؤية روابط تواصله</p>
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث بالرقم أو الاسم أو البريد" className="pr-9 h-11"/>
      </div>
      <div className="space-y-2">
        {filtered.map(u => (
          <Link key={u.id} to={`/u/${u.serial_id}`} className="surface-card surface-card-hover p-3 flex items-center gap-3">
            {u.avatar_url ? <img src={u.avatar_url} className="h-10 w-10 rounded-full object-cover"/> :
              <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center font-black text-primary-foreground">{u.full_name?.[0] || "؟"}</div>}
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate flex items-center gap-1.5">
                {u.full_name}
                {adminIds.has(u.user_id) && <Crown className="h-3 w-3 text-primary" />}
              </div>
              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
            </div>
            <div className="text-xs font-black bg-muted px-2 py-1 rounded-full">#{u.serial_id}</div>
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
