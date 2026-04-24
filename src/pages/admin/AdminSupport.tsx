import { useEffect, useRef, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Send, Inbox } from "lucide-react";
import { playSound } from "@/hooks/useSound";

interface Thread {
  user_id: string;
  full_name: string | null;
  serial_id: number;
  avatar_url: string | null;
  last_at: string;
  unread: number;
}
interface Msg {
  id: string; user_id: string; sender_id: string;
  sender_role: "user" | "admin"; content: string | null;
  created_at: string; is_read: boolean;
}

export default function AdminSupport() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    const { data: messages } = await supabase.from("support_messages")
      .select("user_id, created_at, sender_role, is_read").order("created_at", { ascending: false });
    if (!messages) return;
    const map = new Map<string, { last_at: string; unread: number }>();
    messages.forEach(m => {
      const ex = map.get(m.user_id);
      const unreadInc = m.sender_role === "user" && !m.is_read ? 1 : 0;
      if (!ex) map.set(m.user_id, { last_at: m.created_at, unread: unreadInc });
      else ex.unread += unreadInc;
    });
    const ids = Array.from(map.keys());
    if (!ids.length) { setThreads([]); return; }
    const { data: profs } = await supabase.from("profiles").select("user_id, full_name, serial_id, avatar_url").in("user_id", ids);
    const list: Thread[] = ids.map(id => {
      const p = profs?.find(x => x.user_id === id);
      const m = map.get(id)!;
      return {
        user_id: id, full_name: p?.full_name ?? null, serial_id: p?.serial_id ?? 0,
        avatar_url: p?.avatar_url ?? null, last_at: m.last_at, unread: m.unread,
      };
    }).sort((a, b) => b.last_at.localeCompare(a.last_at));
    setThreads(list);
  };

  const loadMsgs = async (uid: string) => {
    const { data } = await supabase.from("support_messages")
      .select("*").eq("user_id", uid).order("created_at", { ascending: true });
    setMsgs((data ?? []) as Msg[]);
    await supabase.from("support_messages").update({ is_read: true })
      .eq("user_id", uid).eq("sender_role", "user").eq("is_read", false);
    loadThreads();
  };

  useEffect(() => {
    loadThreads();
    const ch = supabase.channel("admin-sm")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, (payload) => {
        const m = payload.new as Msg;
        if (active && m.user_id === active.user_id) {
          setMsgs(p => [...p, m]);
          if (m.sender_role === "user") playSound("notify");
        }
        loadThreads();
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active?.user_id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async () => {
    if (!active || !user || !text.trim()) return;
    const { error } = await supabase.from("support_messages").insert({
      user_id: active.user_id, sender_id: user.id, sender_role: "admin", content: text.trim(),
    });
    if (error) return toast.error(error.message);
    setText(""); playSound("send");
  };

  const filtered = q.trim()
    ? threads.filter(t => String(t.serial_id).includes(q.trim()) || (t.full_name ?? "").includes(q.trim()))
    : threads;

  return (
    <AppLayout>
      <h1 className="text-2xl font-black mb-1">دعم المستخدمين</h1>
      <p className="text-muted-foreground mb-4 text-sm">كل محادثة عبارة عن صندوق وارد موحّد لكل المشرفين</p>

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <div className="surface-card p-3 h-[75vh] flex flex-col">
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث برقم أو اسم" className="pr-9 h-10" />
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
            {filtered.length === 0 && <div className="text-center text-xs text-muted-foreground py-8"><Inbox className="h-8 w-8 mx-auto mb-2"/>لا توجد محادثات</div>}
            {filtered.map(t => (
              <button key={t.user_id} onClick={() => { setActive(t); loadMsgs(t.user_id); }}
                className={`w-full text-right p-2.5 rounded-xl flex items-center gap-2 transition ${
                  active?.user_id === t.user_id ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted"
                }`}>
                {t.avatar_url ? <img src={t.avatar_url} className="h-9 w-9 rounded-full object-cover"/> :
                  <div className="h-9 w-9 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-black text-primary-foreground">{t.full_name?.[0] || "؟"}</div>}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{t.full_name || "مستخدم"}</div>
                  <div className="text-[10px] text-muted-foreground">#{t.serial_id} · {new Date(t.last_at).toLocaleDateString("ar-SA")}</div>
                </div>
                {t.unread > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-black rounded-full px-1.5 py-0.5 min-w-5 text-center">{t.unread}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="surface-card flex flex-col h-[75vh]">
          {!active ? (
            <div className="m-auto text-center text-muted-foreground"><Inbox className="h-10 w-10 mx-auto mb-2"/>اختر محادثة</div>
          ) : (
            <>
              <div className="border-b border-border p-3 flex items-center gap-2">
                {active.avatar_url ? <img src={active.avatar_url} className="h-9 w-9 rounded-full object-cover"/> :
                  <div className="h-9 w-9 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-black text-primary-foreground">{active.full_name?.[0] || "؟"}</div>}
                <div className="flex-1">
                  <div className="font-bold text-sm">{active.full_name}</div>
                  <div className="text-[10px] text-muted-foreground">#{active.serial_id}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                {msgs.map(m => {
                  const me = m.sender_role === "admin";
                  return (
                    <div key={m.id} className={`flex ${me ? "justify-end" : "justify-start"} animate-fade-in`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                        me ? "bg-gradient-gold text-primary-foreground rounded-br-md"
                           : "bg-muted text-foreground rounded-bl-md border border-border/50"
                      }`}>
                        {m.content}
                        <div className={`text-[10px] mt-1 ${me ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(m.created_at).toLocaleString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <div className="border-t border-border p-3 flex gap-2">
                <Input value={text} onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  placeholder="ردّك للمستخدم..." className="h-11" />
                <Button onClick={send} variant="gold" disabled={!text.trim()} className="h-11 px-4">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
