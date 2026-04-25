import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Send, Paperclip, Users, BarChart3, Plus, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Poll from "@/components/Poll";
import ChatAttachment from "@/components/ChatAttachment";

export default function GroupChat() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [showPoll, setShowPoll] = useState(false);
  const [pollQ, setPollQ] = useState("");
  const [pollOpts, setPollOpts] = useState<string[]>(["", ""]);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!id) return;
    const [{ data: g }, { data: ms }, { data: mem }, { data: pls }] = await Promise.all([
      supabase.from("groups").select("*").eq("id", id).maybeSingle(),
      supabase.from("group_messages").select("*").eq("group_id", id).order("created_at"),
      supabase.from("group_members").select("user_id").eq("group_id", id),
      supabase.from("group_polls").select("*").eq("group_id", id).order("created_at", { ascending: false }),
    ]);
    const userIds = Array.from(new Set([...(ms?.map(m => m.user_id) ?? []), ...(mem?.map(m => m.user_id) ?? [])]));
    const { data: profs } = userIds.length
      ? await supabase.from("profiles").select("user_id, full_name, avatar_url, serial_id").in("user_id", userIds)
      : { data: [] as any[] };
    const pMap = new Map((profs ?? []).map(p => [p.user_id, p]));
    setGroup(g);
    setMessages((ms ?? []).map(m => ({ ...m, profiles: pMap.get(m.user_id) })));
    setMembers((mem ?? []).map(m => ({ ...m, profiles: pMap.get(m.user_id) })));
    setPolls(pls ?? []);
  };

  const createPoll = async () => {
    if (!user || !id) return;
    const cleanOpts = pollOpts.map(o => o.trim()).filter(Boolean);
    if (!pollQ.trim() || cleanOpts.length < 2) return toast.error("اكتب السؤال وخيارَين على الأقل");
    const opts = cleanOpts.map((t, i) => ({ id: `o${i + 1}`, text: t }));
    const { error } = await supabase.from("group_polls").insert({
      group_id: id, question: pollQ.trim(), options: opts, created_by: user.id,
    });
    if (error) return toast.error(error.message);
    setPollQ(""); setPollOpts(["", ""]); setShowPoll(false); load();
  };

  useEffect(() => {
    load();
    if (!id) return;
    const ch = supabase.channel(`group-${id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${id}` },
        () => load())
      .on("postgres_changes",
        { event: "*", schema: "public", table: "group_polls", filter: `group_id=eq.${id}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!user || !id || !text.trim()) return;
    const content = text.trim().slice(0, 1000);
    setText("");
    const { error } = await supabase.from("group_messages").insert({ group_id: id, user_id: user.id, content });
    if (error) toast.error(error.message);
  };

  const sendFile = async (file: File) => {
    if (!user || !id) return;
    const path = `${id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("group-files").upload(path, file);
    if (upErr) { toast.error("فشل رفع الملف"); return; }
    const { data: signed } = await supabase.storage.from("group-files").createSignedUrl(path, 60 * 60 * 24 * 7);
    await supabase.from("group_messages").insert({ group_id: id, user_id: user.id, file_url: signed?.signedUrl ?? null, content: file.name });
  };

  if (!group) return <AppLayout><div className="h-64 surface-card animate-pulse" /></AppLayout>;

  return (
    <AppLayout>
      <button onClick={() => navigate("/groups")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowRight className="h-4 w-4" /> المجموعات
      </button>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4 h-[calc(100vh-12rem)]">
        <div className="surface-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-gold flex items-center justify-center"><Users className="h-5 w-5 text-primary-foreground"/></div>
            <div className="flex-1 min-w-0">
              <h2 className="font-black truncate">{group.name}</h2>
              <p className="text-xs text-muted-foreground">{members.length} عضو</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
            {(() => {
              // دمج الرسائل والاستطلاعات في تدفق واحد مرتب بالتاريخ
              const timeline: Array<{ kind: "msg" | "poll"; at: string; data: any }> = [
                ...messages.map(m => ({ kind: "msg" as const, at: m.created_at, data: m })),
                ...polls.map(p => ({ kind: "poll" as const, at: p.created_at, data: p })),
              ].sort((a, b) => a.at.localeCompare(b.at));
              if (timeline.length === 0) {
                return <div className="text-center text-muted-foreground text-sm mt-12">لا توجد رسائل بعد. ابدأ المحادثة!</div>;
              }
              return timeline.map(item => {
                if (item.kind === "poll") {
                  const p = item.data;
                  return (
                    <div key={`p-${p.id}`} className="bg-card rounded-2xl border border-border p-1 animate-fade-in">
                      <Poll scope="group" pollId={p.id} question={p.question} options={p.options as any} />
                    </div>
                  );
                }
                const m = item.data;
                const mine = m.user_id === user?.id;
                return (
                  <div key={m.id} className={cn("flex gap-2", mine && "flex-row-reverse")}>
                    {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="h-8 w-8 rounded-full object-cover shrink-0" /> :
                      <div className="h-8 w-8 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-black text-primary-foreground shrink-0">{m.profiles?.full_name?.[0] || "؟"}</div>}
                    <div className={cn("max-w-[70%] rounded-2xl p-3", mine ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tr-none")}>
                      {!mine && <div className="text-[10px] font-bold mb-1 opacity-80">{m.profiles?.full_name} #{m.profiles?.serial_id}</div>}
                      {m.file_url
                        ? <ChatAttachment url={m.file_url} name={m.content} />
                        : <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>}
                      <div className="text-[10px] opacity-60 mt-1">{formatDistanceToNow(new Date(m.created_at), { locale: arSA, addSuffix: true })}</div>
                    </div>
                  </div>
                );
              });
            })()}
            <div ref={bottomRef} />
          </div>

          {showPoll && (
            <div className="border-t border-border p-3 space-y-2 bg-muted/30">
              <Input placeholder="سؤال الاستطلاع" value={pollQ} onChange={e => setPollQ(e.target.value)} />
              {pollOpts.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder={`خيار ${i + 1}`} value={opt} onChange={e => {
                    const next = [...pollOpts]; next[i] = e.target.value; setPollOpts(next);
                  }} />
                  {pollOpts.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => setPollOpts(pollOpts.filter((_, j) => j !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                {pollOpts.length < 6 && (
                  <Button variant="outline" size="sm" onClick={() => setPollOpts([...pollOpts, ""])}>
                    <Plus className="h-3 w-3" /> خيار
                  </Button>
                )}
                <Button variant="gold" size="sm" onClick={createPoll}>نشر الاستطلاع</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowPoll(false)}>إلغاء</Button>
              </div>
            </div>
          )}

          <div className="p-3 border-t border-border flex gap-2">
            <input ref={fileRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && sendFile(e.target.files[0])} />
            <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} title="إرفاق ملف"><Paperclip className="h-4 w-4"/></Button>
            <Button variant="ghost" size="icon" onClick={() => setShowPoll(s => !s)} title="إنشاء استطلاع"><BarChart3 className="h-4 w-4"/></Button>
            <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="اكتب رسالة..." />
            <Button variant="gold" size="icon" onClick={send}><Send className="h-4 w-4"/></Button>
          </div>
        </div>

        <div className="surface-card p-4 hidden lg:block">
          <h3 className="font-black mb-3 text-sm">الأعضاء ({members.length})</h3>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.user_id} className="flex items-center gap-2">
                {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="h-8 w-8 rounded-full object-cover" /> :
                  <div className="h-8 w-8 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-black text-primary-foreground">{m.profiles?.full_name?.[0] || "؟"}</div>}
                <div className="text-sm">
                  <div className="font-bold">{m.profiles?.full_name}</div>
                  <div className="text-xs text-muted-foreground">#{m.profiles?.serial_id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
