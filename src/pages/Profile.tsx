import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Instagram, Send } from "lucide-react";
import { z } from "zod";

const urlOk = (host: string, val: string) => {
  if (!val) return true;
  try {
    const u = new URL(val);
    return u.hostname.includes(host);
  } catch { return false; }
};

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [ig, setIg] = useState(profile?.instagram_url ?? "");
  const [tt, setTt] = useState(profile?.tiktok_url ?? "");
  const [sc, setSc] = useState(profile?.snapchat_url ?? "");
  const [tg, setTg] = useState(profile?.telegram_url ?? "");
  const [wa, setWa] = useState(profile?.whatsapp_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const save = async () => {
    if (!user) return;
    if (ig && !urlOk("instagram.com", ig)) return toast.error("رابط إنستغرام غير صحيح");
    if (tt && !urlOk("tiktok.com", tt)) return toast.error("رابط تيك توك غير صحيح");
    if (sc && !urlOk("snapchat.com", sc)) return toast.error("رابط سناب شات غير صحيح");
    if (tg && !urlOk("t.me", tg) && !urlOk("telegram.me", tg)) return toast.error("رابط تليجرام غير صحيح");
    if (wa && !urlOk("wa.me", wa) && !urlOk("whatsapp.com", wa)) return toast.error("رابط واتساب غير صحيح");

    const nv = z.string().trim().min(2).max(100).safeParse(fullName);
    if (!nv.success) return toast.error("الاسم غير صالح");

    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: nv.data,
      instagram_url: ig || null, tiktok_url: tt || null, snapchat_url: sc || null,
      telegram_url: tg || null, whatsapp_url: wa || null,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم حفظ التغييرات");
    refreshProfile();
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error("فشل الرفع"); setUploading(false); return; }
    const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
    setUploading(false);
    toast.success("تم تحديث صورتك");
    refreshProfile();
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">ملفي الشخصي</h1>
        <p className="text-muted-foreground">رقمك التعريفي #{profile?.serial_id}</p>
      </div>

      <div className="surface-card p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            {profile?.avatar_url ? <img src={profile.avatar_url} className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/40" /> :
              <div className="h-20 w-20 rounded-full bg-gradient-gold flex items-center justify-center text-3xl font-black text-primary-foreground">{profile?.full_name?.[0] || "؟"}</div>}
            <label className="absolute -bottom-1 -left-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-gold-sm hover:scale-105 transition">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} disabled={uploading} />
            </label>
          </div>
          <div className="flex-1">
            <div className="font-black text-lg">{profile?.full_name}</div>
            <div className="text-sm text-muted-foreground">{profile?.email}</div>
          </div>
        </div>
      </div>

      <div className="surface-card p-6 space-y-4">
        <div>
          <Label>الاسم الكامل</Label>
          <Input value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1.5 h-11" />
        </div>

        <div className="gold-divider my-2" />
        <h3 className="font-black text-sm">روابط التواصل</h3>
        <p className="text-xs text-muted-foreground -mt-2">المنصات المسموح بها فقط: إنستغرام، تيك توك، سناب شات، تليجرام، واتساب</p>

        {[
          { l: "Instagram", v: ig, set: setIg, ph: "https://instagram.com/username" },
          { l: "TikTok", v: tt, set: setTt, ph: "https://tiktok.com/@username" },
          { l: "Snapchat", v: sc, set: setSc, ph: "https://snapchat.com/add/username" },
          { l: "Telegram", v: tg, set: setTg, ph: "https://t.me/username" },
          { l: "WhatsApp", v: wa, set: setWa, ph: "https://wa.me/9665xxxxxxxx" },
        ].map(f => (
          <div key={f.l}>
            <Label>{f.l}</Label>
            <Input value={f.v} onChange={e => f.set(e.target.value)} placeholder={f.ph} className="mt-1.5 h-11" dir="ltr" />
          </div>
        ))}

        <Button onClick={save} variant="gold" size="lg" disabled={saving} className="w-full">{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</Button>
      </div>
    </AppLayout>
  );
}
