import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Users, UserPlus, X } from "lucide-react";

export default function AdminGroups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [searchSerial, setSearchSerial] = useState("");

  const load = async () => {
    const { data } = await supabase.from("groups").select("*, group_members(count)").order("created_at", { ascending: false });
    setGroups(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const loadMembers = async (groupId: string) => {
    const { data } = await supabase.from("group_members")
      .select("user_id, profiles(full_name, serial_id, avatar_url)")
      .eq("group_id", groupId);
    setMembers(data ?? []);
  };

  const save = async () => {
    if (!editing.name?.trim()) return toast.error("ادخل اسم المجموعة");
    if (editing.id) {
      await supabase.from("groups").update({ name: editing.name, description: editing.description }).eq("id", editing.id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: g, error } = await supabase.from("groups").insert({ name: editing.name, description: editing.description, created_by: user!.id }).select().single();
      if (error) return toast.error(error.message);
      setEditing(g);
      await loadMembers(g.id);
    }
    toast.success("تم الحفظ");
    load();
  };

  const addMember = async () => {
    if (!editing?.id || !searchSerial.trim()) return;
    const { data: prof, error: pErr } = await supabase.from("profiles").select("user_id, full_name").eq("serial_id", parseInt(searchSerial)).maybeSingle();
    if (pErr) return toast.error(pErr.message);
    if (!prof) return toast.error("لا يوجد مستخدم بهذا الرقم");
    if (members.length >= (editing.max_members ?? 10)) return toast.error(`الحد الأقصى ${editing.max_members ?? 10} أعضاء`);
    const { error } = await supabase.from("group_members").insert({ group_id: editing.id, user_id: prof.user_id });
    if (error) return toast.error(error.code === "23505" ? "العضو موجود بالفعل" : error.message);
    toast.success(`تمت إضافة ${prof.full_name}`);
    setSearchSerial("");
    await loadMembers(editing.id);
    load();
  };

  const removeMember = async (uid: string) => {
    if (!editing?.id) return;
    const { error } = await supabase.from("group_members").delete().eq("group_id", editing.id).eq("user_id", uid);
    if (error) return toast.error(error.message);
    await loadMembers(editing.id);
    load();
  };

  const removeGroup = async (id: string) => {
    if (!confirm("حذف المجموعة؟")) return;
    await supabase.from("groups").delete().eq("id", id);
    load();
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black mb-2">إدارة المجموعات</h1>
          <p className="text-muted-foreground">إنشاء المجموعات وإضافة الأعضاء</p>
        </div>
        <Button variant="gold" onClick={() => { setEditing({ name: "", description: "" }); setMembers([]); }}><Plus className="h-4 w-4"/>مجموعة جديدة</Button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {groups.map(g => (
          <div key={g.id} className="surface-card p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-gold flex items-center justify-center"><Users className="h-5 w-5 text-primary-foreground"/></div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black truncate">{g.name}</h3>
                <p className="text-xs text-muted-foreground">{g.group_members?.[0]?.count ?? 0} عضو</p>
              </div>
              <Button size="sm" variant="outline" onClick={async () => { setEditing(g); await loadMembers(g.id); }}>إدارة</Button>
              <Button size="icon" variant="ghost" onClick={() => removeGroup(g.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
            </div>
          </div>
        ))}
        {groups.length === 0 && <div className="surface-card p-8 text-center text-muted-foreground md:col-span-2">لا توجد مجموعات بعد</div>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4" onClick={() => setEditing(null)}>
          <div className="bg-card w-full lg:max-w-2xl rounded-t-3xl lg:rounded-3xl max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <h3 className="font-black text-xl">{editing.id ? "إدارة المجموعة" : "مجموعة جديدة"}</h3>
              <div><Label>الاسم</Label><Input value={editing.name ?? ""} onChange={e => setEditing({ ...editing, name: e.target.value })}/></div>
              <div><Label>الوصف</Label><Textarea rows={2} value={editing.description ?? ""} onChange={e => setEditing({ ...editing, description: e.target.value })}/></div>
              <Button variant="gold" onClick={save} className="w-full">حفظ المعلومات</Button>

              {editing.id && (
                <>
                  <div className="gold-divider my-2"/>
                  <h4 className="font-black">الأعضاء ({members.length}/10)</h4>
                  <div className="flex gap-2">
                    <Input placeholder="رقم المستخدم" value={searchSerial} onChange={e => setSearchSerial(e.target.value)} type="number"/>
                    <Button variant="gold" onClick={addMember}><UserPlus className="h-4 w-4"/>إضافة</Button>
                  </div>
                  <div className="space-y-1">
                    {members.map(m => (
                      <div key={m.user_id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted">
                        {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="h-8 w-8 rounded-full object-cover"/> :
                          <div className="h-8 w-8 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-black text-primary-foreground">{m.profiles?.full_name?.[0]}</div>}
                        <div className="flex-1"><div className="text-sm font-bold">{m.profiles?.full_name}</div><div className="text-xs text-muted-foreground">#{m.profiles?.serial_id}</div></div>
                        <Button size="icon" variant="ghost" onClick={() => removeMember(m.user_id)}><X className="h-4 w-4"/></Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
