import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Search, MessageSquare } from "lucide-react";

interface FoundUser {
  user_id: string;
  serial_id: number;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export default function AdminFeedback() {
  const [serial, setSerial] = useState("");
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<FoundUser | null>(null);
  const [title, setTitle] = useState("ملاحظة من المدرّب");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const search = async () => {
    const n = Number(serial);
    if (!Number.isFinite(n)) return toast.error("أدخل رقماً صحيحاً");
    setSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, serial_id, full_name, email, avatar_url")
      .eq("serial_id", n)
      .maybeSingle();
    setSearching(false);
    if (error) return toast.error(error.message);
    if (!data) { setFound(null); return toast.error("لا يوجد مستخدم بهذا الرقم"); }
    setFound(data as FoundUser);
  };

  const send = async () => {
    if (!found) return toast.error("اختر المستخدم أولاً");
    if (body.trim().length < 2) return toast.error("اكتب نص الملاحظة");
    setSending(true);
    const { error } = await supabase.from("notifications").insert({
      user_id: found.user_id,
      title: title.trim() || "ملاحظة من المدرّب",
      body: body.trim(),
      link: "/notifications",
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success(`تم إرسال الملاحظة إلى #${found.serial_id}`);
    setBody("");
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">إرسال ملاحظة لمستخدم</h1>
        <p className="text-muted-foreground">ابحث عن المستخدم بالرقم التسلسلي وأرسل له ملاحظة مباشرة</p>
      </div>

      <div className="surface-card p-6 mb-4">
        <Label>رقم المستخدم</Label>
        <div className="flex gap-2 mt-2">
          <Input
            type="number"
            value={serial}
            onChange={e => setSerial(e.target.value)}
            placeholder="مثال: 12"
            className="h-11"
            onKeyDown={e => e.key === "Enter" && search()}
          />
          <Button variant="gold" onClick={search} disabled={searching}>
            <Search className="h-4 w-4" />
            بحث
          </Button>
        </div>
      </div>

      {found && (
        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            {found.avatar_url ? (
              <img src={found.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/30" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-gold flex items-center justify-center font-black text-primary-foreground">
                {found.full_name?.[0] || "؟"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-black truncate">{found.full_name || "بدون اسم"}</div>
              <div className="text-xs text-muted-foreground truncate">{found.email}</div>
            </div>
            <div className="text-xs font-bold text-primary">#{found.serial_id}</div>
          </div>

          <div>
            <Label>عنوان الملاحظة</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label>نص الملاحظة</Label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} rows={5} className="mt-1.5" placeholder="اكتب ملاحظتك هنا..." />
          </div>
          <Button variant="gold" onClick={send} disabled={sending} className="w-full">
            <Send className="h-4 w-4" />
            {sending ? "جاري الإرسال..." : "إرسال الملاحظة"}
          </Button>
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <MessageSquare className="h-3 w-3 mt-0.5" />
            ستظهر الملاحظة في إشعارات المستخدم فوراً.
          </p>
        </div>
      )}
    </AppLayout>
  );
}
