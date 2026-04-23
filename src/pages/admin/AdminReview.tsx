import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, FileCheck, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Tab = "pending" | "reviewed";

export default function AdminReview() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("pending");
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [status, setStatus] = useState<"passed" | "failed">("passed");

  const load = async () => {
    let q = supabase.from("submissions")
      .select("*, stages(title, order_index, questions, question_text, options, correct_answer, passing_score), profiles!submissions_user_id_fkey(full_name, serial_id, avatar_url, email)")
      .order("created_at", { ascending: false });
    if (tab === "pending") q = q.eq("status", "pending");
    else q = q.in("status", ["passed", "failed"]);
    const { data } = await q.limit(100);
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, [tab]);

  const filtered = search.trim() ? items.filter(i => String(i.profiles?.serial_id ?? "").includes(search.trim())) : items;

  const open = (s: any) => {
    setSelected(s);
    setScore(s.score ?? 60);
    setFeedback(s.feedback ?? "");
    setStatus(s.status === "failed" ? "failed" : "passed");
  };

  const fileSignedUrl = async (path: string) => {
    const { data } = await supabase.storage.from("submissions").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const saveReview = async () => {
    if (!selected || !user) return;
    const passing = selected.stages?.passing_score ?? 60;
    const finalStatus = status === "passed" && score >= passing ? "passed" : "failed";
    const { error } = await supabase.from("submissions").update({
      score, feedback, status: finalStatus, reviewed_by: user.id, reviewed_at: new Date().toISOString(),
    }).eq("id", selected.id);
    if (error) return toast.error(error.message);

    // Notification
    await supabase.from("notifications").insert({
      user_id: selected.user_id,
      title: finalStatus === "passed" ? "نجحت في المرحلة!" : "نتيجة تصحيحك جاهزة",
      body: `${selected.stages?.title} - ${score}%${feedback ? "\n" + feedback : ""}`,
      link: "/feedback",
    });
    toast.success("تم حفظ التصحيح");
    setSelected(null);
    load();
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-black mb-2">صفحة التصحيح</h1>
        <p className="text-muted-foreground">راجع تسليمات المتدربين وأعطِ ملاحظاتك</p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Button variant={tab === "pending" ? "gold" : "outline"} size="sm" onClick={() => setTab("pending")}>قيد المراجعة</Button>
        <Button variant={tab === "reviewed" ? "gold" : "outline"} size="sm" onClick={() => setTab("reviewed")}>صفحة المصحح</Button>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم المستخدم" className="h-10 w-56 pr-9"/>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="surface-card p-12 text-center text-muted-foreground"><FileCheck className="h-12 w-12 mx-auto mb-2"/>لا توجد تسليمات</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => {
            const opts = (s.stages?.options as any[]) || [];
            const userAns = opts.find(o => o.id === s.answer_text)?.text || s.answer_text || (s.file_url ? "📎 ملف" : "—");
            return (
              <button key={s.id} onClick={() => open(s)} className="w-full text-right surface-card p-4 surface-card-hover">
                <div className="flex items-start gap-3">
                  {s.profiles?.avatar_url ? <img src={s.profiles.avatar_url} className="h-10 w-10 rounded-full object-cover"/> :
                    <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center text-sm font-black text-primary-foreground">{s.profiles?.full_name?.[0]}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 text-xs"><span className="font-bold">{s.profiles?.full_name}</span><span className="text-muted-foreground">#{s.profiles?.serial_id}</span></div>
                    <div className="font-bold text-sm">المرحلة {s.stages?.order_index} • {s.stages?.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{userAns}</div>
                  </div>
                  <div className="text-xs">
                    {s.status === "pending" && <span className="bg-warning/15 text-warning px-2 py-1 rounded-full font-bold">مراجعة</span>}
                    {s.status === "passed" && <span className="bg-success/15 text-success px-2 py-1 rounded-full font-bold">{s.score}%</span>}
                    {s.status === "failed" && <span className="bg-destructive/15 text-destructive px-2 py-1 rounded-full font-bold">راسب</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4" onClick={() => setSelected(null)}>
          <div className="bg-card w-full lg:max-w-2xl rounded-t-3xl lg:rounded-3xl max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-black text-xl">{selected.stages?.title}</h3>
                <p className="text-sm text-muted-foreground">{selected.profiles?.full_name} #{selected.profiles?.serial_id} • {selected.profiles?.email}</p>
              </div>

              {(() => {
                const questions = (selected.stages?.questions as any[]) || [];
                const answers = (selected.answers as any[]) || [];
                if (questions.length && answers.length) {
                  return (
                    <div className="space-y-3">
                      {questions.map((q: any, idx: number) => {
                        const ans = answers.find((a: any) => a.question_id === q.id) || answers[idx];
                        const opt = (q.options || []).find((o: any) => o.id === ans?.answer);
                        return (
                          <div key={q.id || idx} className="bg-muted/40 rounded-xl p-3 text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-bold text-muted-foreground">سؤال {idx + 1} ({q.points} درجة)</div>
                              {ans?.awarded != null && (
                                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${ans.correct ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                                  {ans.awarded}/{q.points}
                                </span>
                              )}
                            </div>
                            <div className="font-bold mb-1">{q.text}</div>
                            <div className="text-xs text-muted-foreground mb-1">إجابة المتدرب:</div>
                            {ans?.type === "file" && ans.file_url ? (
                              <Button onClick={() => fileSignedUrl(ans.file_url)} variant="outline" size="sm"><ExternalLink className="h-3 w-3"/>فتح الملف</Button>
                            ) : (
                              <div className="whitespace-pre-wrap">{opt?.text || ans?.answer || "—"}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                // legacy single-question
                return (
                  <>
                    <div className="bg-muted/40 rounded-xl p-3 text-sm">
                      <div className="text-xs font-bold text-muted-foreground mb-1">السؤال</div>
                      {selected.stages?.question_text}
                    </div>
                    <div className="bg-muted/40 rounded-xl p-3 text-sm">
                      <div className="text-xs font-bold text-muted-foreground mb-1">إجابة المتدرب</div>
                      <div className="whitespace-pre-wrap">{selected.answer_text || "—"}</div>
                      {selected.file_url && <Button onClick={() => fileSignedUrl(selected.file_url)} variant="outline" size="sm" className="mt-2"><ExternalLink className="h-3 w-3"/>فتح الملف</Button>}
                    </div>
                  </>
                );
              })()}

              <div>
                <Label>الدرجة (0-100)</Label>
                <Input type="number" min={0} max={100} value={score} onChange={e => setScore(parseInt(e.target.value || "0"))} className="mt-1.5 h-11"/>
              </div>

              <div>
                <Label>ملاحظة المدرّب</Label>
                <Textarea rows={4} value={feedback} onChange={e => setFeedback(e.target.value)} className="mt-1.5"/>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStatus("passed")} variant={status === "passed" ? "gold" : "outline"} className="flex-1">ناجح</Button>
                <Button onClick={() => setStatus("failed")} variant={status === "failed" ? "destructive" : "outline"} className="flex-1">راسب</Button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={saveReview} variant="gold" className="flex-1">حفظ التصحيح</Button>
                <Button onClick={() => setSelected(null)} variant="ghost">إغلاق</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
