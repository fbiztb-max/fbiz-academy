// Admin News management — uses existing News page composer; this is a list with edit/delete
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminNews() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const load = async () => {
    const { data } = await supabase.from("news").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.title?.trim() || !editing.content?.trim()) return toast.error("املأ الحقول");
    let image_url = editing.image_url;
    if (imageFile) {
      const path = `${Date.now()}-${imageFile.name}`;
      const { error } = await supabase.storage.from("news").upload(path, imageFile);
      if (error) return toast.error("فشل رفع الصورة");
      image_url = supabase.storage.from("news").getPublicUrl(path).data.publicUrl;
    }
    if (editing.id) {
      await supabase.from("news").update({ title: editing.title, content: editing.content, image_url }).eq("id", editing.id);
    } else {
      await supabase.from("news").insert({ title: editing.title, content: editing.content, image_url, author_id: user!.id });
    }
    toast.success("تم الحفظ"); setEditing(null); setImageFile(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف الخبر؟")) return;
    await supabase.from("news").delete().eq("id", id); load();
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-3xl font-black mb-2">إدارة الأخبار</h1><p className="text-muted-foreground">نشر وتعديل الإعلانات</p></div>
        <Button variant="gold" onClick={() => setEditing({ title: "", content: "" })}><Plus className="h-4 w-4"/>منشور جديد</Button>
      </div>

      <div className="space-y-2">
        {items.map(n => (
          <div key={n.id} className="surface-card p-4 flex items-center gap-3">
            {n.image_url && <img src={n.image_url} className="h-14 w-14 rounded-xl object-cover"/>}
            <div className="flex-1 min-w-0"><div className="font-black truncate">{n.title}</div><div className="text-xs text-muted-foreground line-clamp-1">{n.content}</div></div>
            <Button size="sm" variant="outline" onClick={() => setEditing(n)}>تعديل</Button>
            <Button size="icon" variant="ghost" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
          </div>
        ))}
        {items.length === 0 && <div className="surface-card p-8 text-center text-muted-foreground">لا توجد منشورات</div>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4" onClick={() => setEditing(null)}>
          <div className="bg-card w-full lg:max-w-2xl rounded-t-3xl lg:rounded-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-3">
              <h3 className="font-black text-xl">{editing.id ? "تعديل الخبر" : "خبر جديد"}</h3>
              <Input placeholder="العنوان" value={editing.title ?? ""} onChange={e => setEditing({ ...editing, title: e.target.value })}/>
              <Textarea rows={6} placeholder="المحتوى..." value={editing.content ?? ""} onChange={e => setEditing({ ...editing, content: e.target.value })}/>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)} className="text-sm"/>
              {editing.image_url && !imageFile && <img src={editing.image_url} className="h-32 rounded-xl object-cover"/>}
              <div className="flex gap-2"><Button variant="gold" onClick={save} className="flex-1">حفظ</Button><Button variant="ghost" onClick={() => setEditing(null)}>إلغاء</Button></div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
