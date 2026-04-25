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

export default function GroupChat() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!id) return;
    const [{ data: g }, { data: ms }, { data: mem }] = await Promise.all([
      supabase.from("groups").select("*").eq("id", id).maybeSingle(),
      supabase.from("group_messages").select("*").eq("group_id", id).order("created_at"),
      supabase.from("group_members").select("user_id").eq("group_id", id),
    ]);
    const userIds = Array.from(new Set([...(ms?.map(m => m.user_id) ?? []), ...(mem?.map(m => m.user_id) ?? [])]));
    const { data: profs } = userIds.length
      ? await supabase.from("profiles").select("user_id, full_name, avatar_url, serial_id").in("user_id", userIds)
      : { data: [] as any[] };
    const pMap = new Map((profs ?? []).map(p => [p.user_id, p]));
    setGroup(g);
    setMessages((ms ?? []).map(m => ({ ...m, profiles: pMap.get(m.user_id) })));
    setMembers((mem ?? []).map(m => ({ ...m, profiles: pMap.get(m.user_id) })));
  };

  useEffect(() => {
    load();
    if (!id) return;
    const ch = supabase.channel(`group-${id}`).on("postgres_changes",
      { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${id}` },
      () => load()
    ).subscribe();
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
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm mt-12">لا توجد رسائل بعد. ابدأ المحادثة!</div>
            ) : messages.map(m => {
              const mine = m.user_id === user?.id;
              return (
                <div key={m.id} className={cn("flex gap-2", mine && "flex-row-reverse")}>
                  {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="h-8 w-8 rounded-full object-cover shrink-0" /> :
                    <div className="h-8 w-8 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-black text-primary-foreground shrink-0">{m.profiles?.full_name?.[0] || "؟"}</div>}
                  <div className={cn("max-w-[70%] rounded-2xl p-3", mine ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tr-none")}>
                    {!mine && <div className="text-[10px] font-bold mb-1 opacity-80">{m.profiles?.full_name} #{m.profiles?.serial_id}</div>}
                    {m.file_url ? <a href={m.file_url} target="_blank" className="underline text-sm">📎 {m.content}</a> : <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>}
                    <div className="text-[10px] opacity-60 mt-1">{formatDistanceToNow(new Date(m.created_at), { locale: arSA, addSuffix: true })}</div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-border flex gap-2">
            <input ref={fileRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && sendFile(e.target.files[0])} />
            <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()}><Paperclip className="h-4 w-4"/></Button>
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
