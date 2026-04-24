import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Instagram, Send, ArrowRight, MessageCircle } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function UserProfile() {
  const { id } = useParams();
  const { isAdmin, profile: me } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      // id can be uuid or serial number
      const isNum = /^\d+$/.test(id);
      const q = isNum
        ? supabase.from("profiles").select("*").eq("serial_id", parseInt(id)).maybeSingle()
        : supabase.from("profiles").select("*").eq("user_id", id).maybeSingle();
      const { data } = await q;
      setProfile(data); setLoading(false);
    })();
  }, [id]);

  // Only admins can see other people's profiles. Users always view their own /profile.
  if (!loading && !profile) return <Navigate to="/" replace />;
  if (!isAdmin && profile && me?.user_id !== profile.user_id) return <Navigate to="/" replace />;

  const socials = profile && [
    { l: "Instagram", v: profile.instagram_url, color: "from-[#F58529] via-[#DD2A7B] to-[#8134AF]", icon: <Instagram className="h-4 w-4"/> },
    { l: "TikTok", v: profile.tiktok_url, color: "from-black to-neutral-800", icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19.6 6.3a5.2 5.2 0 0 1-3.1-1.1 5.3 5.3 0 0 1-2-3.2h-3.3v13.4a2.7 2.7 0 1 1-2.7-2.7c.3 0 .6 0 .9.1V9.4a6 6 0 1 0 5.1 5.9V8.9a8.5 8.5 0 0 0 5.1 1.7V7.3c-.3 0-.7 0-1-.1z"/></svg>
    )},
    { l: "Snapchat", v: profile.snapchat_url, color: "from-[#FFFC00] to-[#FFEC00]", icon: (
      <svg viewBox="0 0 512 512" fill="currentColor" className="h-5 w-5"><path d="M255.9 30c-44.5 0-86.7 25.4-104.8 65.5-9.3 20.5-9.3 41.6-9.1 67.4.1 4.2.2 8.6.2 13.1 0 1.1-.4 1.9-1.3 2.5-1.7 1.1-4.6 1.7-7.5 1.1-4-.8-8.7-3-14-6.6-2.5-1.7-5.7-2.6-9.1-2.6-5.5 0-11.4 2.3-15.6 6.4-5.1 5-7 11.6-5 17.6 3.1 9.5 12.3 16.2 30.6 22.4 1.6.5 3.5 1 5.5 1.6 6.7 1.9 16.8 4.7 19.7 11.4 1.5 3.4 1 7.6-1.5 12.6-.4.7-37 73.4-104.5 84.6-3.5.6-6 3.7-5.8 7.3.1 1 .3 2.1.7 3.1 4.7 11 25.7 19 64.1 24.4 1.2 1.7 2.5 7.5 3.2 11 1.4 6.4 2.9 13.1 7.6 14.7 1.8.6 3.9.6 6.5.1 5.6-1 13.5-2.4 23.6-2.4 5.6 0 11.4.5 17.5 1.4 11.5 1.7 21.4 8.3 32.9 16 16.4 11 35 23.4 63.2 23.4.8 0 1.5 0 2.3-.1 1 .1 2.1.1 3.2.1 28.2 0 46.8-12.4 63.2-23.4 11.4-7.7 21.3-14.3 32.9-16 6.1-.9 11.9-1.4 17.5-1.4 9.6 0 17.4 1.2 23.6 2.4 2.7.5 4.7.4 6.5-.1 5-1.5 6.4-7.9 7.7-14.6.7-3.4 2-9.3 3.2-11 38.4-5.4 59.4-13.3 64.1-24.4.4-1 .7-2 .7-3.1.2-3.6-2.3-6.7-5.8-7.3-67.5-11.1-104.1-83.8-104.5-84.6-2.5-5-3-9.2-1.5-12.6 2.9-6.6 13-9.5 19.7-11.4 2-.6 3.9-1.1 5.5-1.6 13.5-4.6 27.3-11.4 30.7-22.5 1.6-5.4-.1-11.6-4.7-16.6-4.6-5-11-7.8-17.4-7.8-2.7 0-5.5.5-8.1 1.7-4.3 2-9.4 4.5-14.4 5.6-3 .7-5.9.1-7.5-1.1-.9-.6-1.3-1.4-1.3-2.5 0-4.5.1-8.9.2-13.1.2-25.8.2-46.9-9.1-67.4C342.6 55.4 300.4 30 255.9 30z"/></svg>
    )},
    { l: "Telegram", v: profile.telegram_url, color: "from-[#229ED9] to-[#1B7FAE]", icon: <Send className="h-4 w-4"/> },
    { l: "WhatsApp", v: profile.whatsapp_url, color: "from-[#25D366] to-[#128C7E]", icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.5 3.5A11 11 0 0 0 3.6 17.3L2 22l4.8-1.5A11 11 0 1 0 20.5 3.5zM12 20a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-5.5c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.1-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5l-.7-1.6c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.2 1 2.4.1.2 1.6 2.5 4 3.5.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1z"/></svg>
    )},
  ].filter(s => s.v);

  if (loading) return <AppLayout><div className="text-center py-20 text-muted-foreground">جاري التحميل...</div></AppLayout>;

  return (
    <AppLayout>
      <Link to={isAdmin ? "/admin/users" : "/"} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
        <ArrowRight className="h-4 w-4"/> رجوع
      </Link>

      <div className="surface-card p-6 mb-4 text-center">
        <div className="relative inline-block">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} className="h-28 w-28 rounded-full object-cover ring-4 ring-primary/40 mx-auto"/>
          ) : (
            <div className="h-28 w-28 rounded-full bg-gradient-gold flex items-center justify-center text-4xl font-black text-primary-foreground mx-auto">
              {profile.full_name?.[0] || "؟"}
            </div>
          )}
        </div>
        <h1 className="text-2xl font-black mt-4">{profile.full_name}</h1>
        <p className="text-xs text-muted-foreground">رقم #{profile.serial_id}</p>
        {isAdmin && <p className="text-xs text-muted-foreground mt-1">{profile.email}</p>}
      </div>

      {socials && socials.length > 0 ? (
        <div className="surface-card p-5">
          <h2 className="font-black text-sm mb-3 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary"/> روابط التواصل</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {socials.map(s => (
              <a key={s.l} href={s.v!} target="_blank" rel="noopener noreferrer"
                className={`bg-gradient-to-br ${s.color} text-white rounded-xl p-3 flex items-center gap-2 font-bold text-sm hover:scale-105 transition shadow-sm`}>
                <span className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">{s.icon}</span>
                <span>{s.l}</span>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">لم يضف هذا المستخدم روابط تواصل بعد.</div>
      )}
    </AppLayout>
  );
}
