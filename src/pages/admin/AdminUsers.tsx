import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("*").order("serial_id");
      setUsers(data ?? []);
    })();
  }, []);
  const filtered = q.trim() ? users.filter(u =>
    String(u.serial_id).includes(q) || u.full_name?.includes(q) || u.email?.includes(q)
  ) : users;
  return (
    <AppLayout>
      <h1 className="text-3xl font-black mb-2">المستخدمون</h1>
      <p className="text-muted-foreground mb-6">قائمة جميع المستخدمين المسجلين</p>
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث بالرقم أو الاسم أو البريد" className="pr-9 h-11"/>
      </div>
      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className="surface-card p-3 flex items-center gap-3">
            {u.avatar_url ? <img src={u.avatar_url} className="h-10 w-10 rounded-full object-cover"/> :
              <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center font-black text-primary-foreground">{u.full_name?.[0] || "؟"}</div>}
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{u.full_name}</div>
              <div className="text-xs text-muted-foreground truncate">{u.email}</div>
            </div>
            <div className="text-xs font-black bg-muted px-2 py-1 rounded-full">#{u.serial_id}</div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
