import { useEffect, useRef, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Headphones, ShieldCheck } from "lucide-react";
import { playSound } from "@/hooks/useSound";

interface Msg {
  id: string;
  user_id: string;
  sender_id: string;
  sender_role: "user" | "admin";
  content: string | null;
  created_at: string;
  is_read: boolean;
}

export default function SupportChat() {
  const { user, profile } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("support_messages")
      .select("*").eq("user_id", user.id).order("created_at", { ascending: true });
    setMsgs((data ?? []) as Msg[]);
    // mark admin messages as read
    await supabase.from("support_messages").update({ is_read: true })
      .eq("user_id", user.id).eq("sender_role", "admin").eq("is_read", false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel(`sm-${user.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "support_messages",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          const m = payload.new as Msg;
          setMsgs(p => [...p, m]);
          if (m.sender_role === "admin") playSound("notify");
        }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async () => {
    if (!user || !text.trim()) return;
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      user_id: user.id, sender_id: user.id, sender_role: "user", content: text.trim(),
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setText("");
    playSound("send");
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-11 w-11 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold-sm">
            <Headphones className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-black">دعم الأدمن</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-primary" />
              محادثة موحّدة — جميع المشرفين يرونها ويردّون عليك
            </p>
          </div>
        </div>
      </div>

      <div className="surface-card flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
          {msgs.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">
              ابدأ المحادثة — اكتب سؤالك أو ملاحظتك وسيردّ عليك أحد المشرفين.
            </div>
          )}
          {msgs.map(m => {
            const me = m.sender_role === "user";
            return (
              <div key={m.id} className={`flex ${me ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap shadow-sm ${
                  me ? "bg-gradient-gold text-primary-foreground rounded-br-md"
                     : "bg-muted text-foreground rounded-bl-md border border-border/50"
                }`}>
                  {!me && <div className="text-[10px] font-black mb-0.5 text-primary">المشرف</div>}
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
            placeholder="اكتب رسالتك للمشرفين..." className="h-11" />
          <Button onClick={send} variant="gold" disabled={sending || !text.trim()} className="h-11 px-4">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
