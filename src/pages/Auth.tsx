import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/fbiz-logo.png";
import FloatingContact from "@/components/FloatingContact";

const emailSchema = z.string().trim().email({ message: "بريد إلكتروني غير صحيح" }).max(255);
const passwordSchema = z.string().min(6, { message: "كلمة المرور 6 أحرف على الأقل" }).max(72);
const nameSchema = z.string().trim().min(2, { message: "الاسم قصير جداً" }).max(100);

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) { navigate("/"); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ev = emailSchema.safeParse(email);
      if (!ev.success) { toast.error(ev.error.issues[0].message); return; }
      const pv = passwordSchema.safeParse(password);
      if (!pv.success) { toast.error(pv.error.issues[0].message); return; }

      if (mode === "register") {
        const nv = nameSchema.safeParse(fullName);
        if (!nv.success) { toast.error(nv.error.issues[0].message); return; }
        const { error } = await supabase.auth.signUp({
          email: ev.data,
          password: pv.data,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: nv.data },
          },
        });
        if (error) { toast.error(error.message === "User already registered" ? "هذا البريد مسجل مسبقاً" : error.message); return; }
        toast.success("تم إنشاء حسابك بنجاح! مرحباً بك");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: ev.data, password: pv.data });
        if (error) { toast.error(error.message === "Invalid login credentials" ? "البريد أو كلمة المرور غير صحيحة" : error.message); return; }
        toast.success("أهلاً بعودتك");
        navigate("/");
      }
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("تعذر تسجيل الدخول عبر Google"); setLoading(false); return; }
    if (result.redirected) return;
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      {/* Left visual panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-navy">
        <div className="absolute inset-0 bg-gradient-radial-gold opacity-60" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-glow/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-4" dir="rtl">
            <div className="h-16 w-16 rounded-2xl overflow-hidden ring-1 ring-primary/40 shadow-gold bg-[hsl(217_70%_13%)] shrink-0">
              <img src={logo} alt="FBiz" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-black text-2xl flex items-center gap-2">
                <span>أكاديمية</span>
                <bdi className="text-gradient-gold" style={{ unicodeBidi: "isolate" }}>FBiz</bdi>
              </div>
              <div className="text-xs text-white/60">فراس بزنس · تدريب الأعمال</div>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-5xl font-black leading-tight mb-6">
              من <span className="text-gradient-gold">قناة FBiz</span><br />
              إلى تنفيذ حقيقي للأعمال
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-md">
              أكاديمية فراس بزنس تحوّل المعرفة إلى مهارة عبر مراحل تنفيذية، تقييم دقيق، وملاحظات شخصية تواكب رحلتك خطوة بخطوة.
            </p>
          </motion.div>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <div>© أكاديمية FBiz · فراس بزنس</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8" dir="rtl">
            <div className="h-12 w-12 rounded-xl overflow-hidden ring-1 ring-primary/30 bg-[hsl(217_70%_13%)] shrink-0">
              <img src={logo} alt="FBiz" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-black text-lg leading-tight flex items-center gap-1.5">
                <span>أكاديمية</span>
                <bdi className="text-gradient-gold" style={{ unicodeBidi: "isolate" }}>FBiz</bdi>
              </div>
              <span className="text-[10px] text-muted-foreground">فراس بزنس</span>
            </div>
          </div>

          <h2 className="text-3xl font-black mb-2">
            {mode === "login" ? "أهلاً بعودتك" : "أنشئ حسابك"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {mode === "login" ? "سجّل دخولك لمتابعة مسارك" : "ابدأ رحلتك في إتقان الأعمال"}
          </p>

          <Button onClick={handleGoogle} variant="outline" size="lg" className="w-full mb-4" disabled={loading}>
            <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            متابعة عبر Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full gold-divider" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-4 text-xs text-muted-foreground">أو</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <div className="relative">
                  <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="اكتب اسمك" className="pr-10 h-12" required />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="pr-10 h-12" required dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pr-10 h-12" required />
              </div>
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === "login" ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
            <button onClick={() => setMode(m => m === "login" ? "register" : "login")} className="font-bold text-primary hover:underline">
              {mode === "login" ? "أنشئ حساباً" : "سجّل دخولك"}
            </button>
          </p>
          <p className="text-center text-[11px] text-muted-foreground mt-4">
            بإنشائك حساباً فأنت توافق على{" "}
            <a href="/terms" className="text-primary hover:underline">الشروط والأحكام</a>
            {" "}و{" "}
            <a href="/privacy" className="text-primary hover:underline">سياسة الخصوصية</a>
          </p>
        </motion.div>
      </div>
      <FloatingContact />
    </div>
  );
}
