import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldAlert, Trash2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { audit } from "./audit";
import { toast } from "sonner";

export default function DataDeletionPanel() {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<{ created_at: string; status: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("data_deletion_requests")
        .select("created_at,status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && data.status === "pending") setPending(data);
    })();
  }, [user]);

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("data_deletion_requests").insert({
      user_id: user.id,
      reason: reason.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error("تعذّر إرسال الطلب"); return; }
    audit("data.deletion_request", "self");
    setPending({ created_at: new Date().toISOString(), status: "pending" });
    setReason("");
    toast.success("تم استلام طلبك. سيتم مراجعته قريباً");
  };

  return (
    <div dir="rtl" className="surface-card p-6 space-y-4 border-2 border-destructive/20">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-black">حماية البيانات الشخصية</h3>
          <p className="text-xs text-muted-foreground">وفقاً لنظام حماية البيانات الشخصية السعودي (PDPL)</p>
        </div>
      </div>

      {pending ? (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-warning/10 border border-warning/30 text-sm">
          <Clock className="h-4 w-4 text-warning" />
          <span>طلب الحذف قيد المراجعة منذ {new Date(pending.created_at).toLocaleDateString("ar")}</span>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label>سبب طلب حذف البيانات (اختياري)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="اكتب سبب طلبك..."
              className="resize-none"
            />
          </div>
          <Button onClick={submit} disabled={submitting} variant="destructive" className="gap-2">
            <Trash2 className="h-4 w-4" />
            {submitting ? "جاري الإرسال..." : "طلب حذف بياناتي"}
          </Button>
          <p className="text-xs text-muted-foreground">
            يحق لك طلب حذف بياناتك الشخصية في أي وقت. ستتم مراجعة الطلب من فريق الإدارة وفقاً للأنظمة المعمول بها.
          </p>
        </>
      )}
    </div>
  );
}
