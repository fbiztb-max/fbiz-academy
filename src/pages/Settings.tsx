import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Moon, Sun } from "lucide-react";

export default function Settings() {
  const { theme, toggle } = useTheme();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    if (pw.length < 6) return toast.error("كلمة المرور 6 أحرف على الأقل");
    if (pw !== pw2) return toast.error("كلمتا المرور غير متطابقتين");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم تغيير كلمة المرور");
    setPw(""); setPw2("");
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">الإعدادات</h1>
        <p className="text-muted-foreground">تخصيص حسابك ومظهر المنصة</p>
      </div>

      <div className="surface-card p-6 mb-4">
        <h3 className="font-black mb-4">المظهر</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-sm">الوضع الحالي: {theme === "dark" ? "داكن" : "فاتح"}</div>
            <div className="text-xs text-muted-foreground">اختر المظهر المريح لعينيك</div>
          </div>
          <Button variant="outline" onClick={toggle}>
            {theme === "dark" ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
            {theme === "dark" ? "وضع فاتح" : "وضع داكن"}
          </Button>
        </div>
      </div>

      <div className="surface-card p-6">
        <h3 className="font-black mb-4">تغيير كلمة المرور</h3>
        <div className="space-y-3">
          <div>
            <Label>كلمة المرور الجديدة</Label>
            <Input type="password" value={pw} onChange={e => setPw(e.target.value)} className="mt-1.5 h-11" />
          </div>
          <div>
            <Label>تأكيد كلمة المرور</Label>
            <Input type="password" value={pw2} onChange={e => setPw2(e.target.value)} className="mt-1.5 h-11" />
          </div>
          <Button variant="gold" onClick={changePassword} disabled={saving}>{saving ? "جاري الحفظ..." : "تحديث كلمة المرور"}</Button>
        </div>
      </div>
    </AppLayout>
  );
}
