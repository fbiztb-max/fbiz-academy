import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";

export default function AdminStages() {
  const [stages, setStages] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const blank = () => ({
    order_index: (stages.at(-1)?.order_index ?? 0) + 1,
    title: "", description: "", question_type: "mcq", question_text: "",
    options: [{ id: "a", text: "" }, { id: "b", text: "" }],
    correct_answer: "a", passing_score: 60, youtube_url: "", is_published: true,
  });

  const load = async () => {
    const { data } = await supabase.from("stages").select("*").order("order_index");
    setStages(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.question_text.trim()) return toast.error("املأ كل الحقول");
    const payload = { ...editing };
    delete payload.id;
    if (editing.question_type === "text" || editing.question_type === "file") {
      payload.options = null; payload.correct_answer = null;
    }
    const { error } = editing.id
      ? await supabase.from("stages").update(payload).eq("id", editing.id)
      : await supabase.from("stages").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف المرحلة؟ سيتم حذف جميع التسليمات المرتبطة.")) return;
    await supabase.from("stages").delete().eq("id", id);
    load();
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black mb-2">إدارة المراحل</h1>
          <p className="text-muted-foreground">إنشاء وتعديل مراحل المسار</p>
        </div>
        <Button variant="gold" onClick={() => setEditing(blank())}><Plus className="h-4 w-4"/>مرحلة جديدة</Button>
      </div>

      <div className="space-y-2">
        {stages.map(s => (
          <div key={s.id} className="surface-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-gold flex items-center justify-center font-black text-primary-foreground text-sm">{s.order_index}</div>
            <div className="flex-1 min-w-0">
              <div className="font-black truncate">{s.title}</div>
              <div className="text-xs text-muted-foreground">نوع: {s.question_type} • نجاح: {s.passing_score}%</div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => setEditing(s)}><Edit className="h-4 w-4"/></Button>
            <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
          </div>
        ))}
        {stages.length === 0 && <div className="surface-card p-8 text-center text-muted-foreground">لا توجد مراحل بعد. ابدأ بإضافة الأولى</div>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4" onClick={() => setEditing(null)}>
          <div className="bg-card w-full lg:max-w-2xl rounded-t-3xl lg:rounded-3xl max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-3">
              <h3 className="font-black text-xl">{editing.id ? "تعديل المرحلة" : "مرحلة جديدة"}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الترتيب</Label><Input type="number" value={editing.order_index} onChange={e => setEditing({ ...editing, order_index: parseInt(e.target.value || "1") })}/></div>
                <div><Label>درجة النجاح</Label><Input type="number" value={editing.passing_score} onChange={e => setEditing({ ...editing, passing_score: parseInt(e.target.value || "60") })}/></div>
              </div>
              <div><Label>العنوان</Label><Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}/></div>
              <div><Label>الوصف</Label><Textarea rows={2} value={editing.description ?? ""} onChange={e => setEditing({ ...editing, description: e.target.value })}/></div>
              <div><Label>رابط يوتيوب (اختياري)</Label><Input dir="ltr" value={editing.youtube_url ?? ""} onChange={e => setEditing({ ...editing, youtube_url: e.target.value })} placeholder="https://youtube.com/watch?v=..."/></div>
              <div>
                <Label>نوع السؤال</Label>
                <select value={editing.question_type} onChange={e => setEditing({ ...editing, question_type: e.target.value })} className="w-full h-11 rounded-xl border-2 border-border bg-background px-3 mt-1.5">
                  <option value="mcq">اختيار من متعدد</option>
                  <option value="truefalse">صح/خطأ</option>
                  <option value="text">نص مفتوح</option>
                  <option value="file">رفع ملف</option>
                </select>
              </div>
              <div><Label>نص السؤال</Label><Textarea rows={3} value={editing.question_text} onChange={e => setEditing({ ...editing, question_text: e.target.value })}/></div>

              {editing.question_type === "mcq" && (
                <div className="space-y-2">
                  <Label>الخيارات</Label>
                  {(editing.options || []).map((opt: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input type="radio" checked={editing.correct_answer === opt.id} onChange={() => setEditing({ ...editing, correct_answer: opt.id })}/>
                      <Input value={opt.text} onChange={e => {
                        const o = [...editing.options]; o[idx] = { ...opt, text: e.target.value };
                        setEditing({ ...editing, options: o });
                      }} placeholder={`الخيار ${idx + 1}`}/>
                      <Button size="icon" variant="ghost" onClick={() => {
                        const o = editing.options.filter((_: any, i: number) => i !== idx);
                        setEditing({ ...editing, options: o });
                      }}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => {
                    const id = String.fromCharCode(97 + (editing.options?.length || 0));
                    setEditing({ ...editing, options: [...(editing.options || []), { id, text: "" }] });
                  }}><Plus className="h-3 w-3"/>خيار</Button>
                  <p className="text-xs text-muted-foreground">حدد الإجابة الصحيحة بالنقطة الجانبية</p>
                </div>
              )}

              {editing.question_type === "truefalse" && (
                <div>
                  <Label>الإجابة الصحيحة</Label>
                  <select value={editing.correct_answer ?? "true"} onChange={e => setEditing({ ...editing, correct_answer: e.target.value, options: [{ id: "true", text: "صح" }, { id: "false", text: "خطأ" }] })} className="w-full h-11 rounded-xl border-2 border-border bg-background px-3 mt-1.5">
                    <option value="true">صح</option>
                    <option value="false">خطأ</option>
                  </select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="gold" onClick={save} className="flex-1">حفظ</Button>
                <Button variant="ghost" onClick={() => setEditing(null)}>إلغاء</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
