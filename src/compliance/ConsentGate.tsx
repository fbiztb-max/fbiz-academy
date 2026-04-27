import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { ShieldCheck, GraduationCap, Lock } from "lucide-react";
import { useConsent } from "./ConsentProvider";
import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER_AR, COMPLIANCE } from "./constants";
import { toast } from "sonner";

export default function ConsentGate() {
  const { user } = useAuth();
  const { loading, hasConsent, acceptAll } = useConsent();
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [disclaimer, setDisclaimer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user || loading || hasConsent) return null;

  const allChecked = terms && privacy && disclaimer;

  const handleAccept = async () => {
    if (!allChecked) return;
    setSubmitting(true);
    try {
      await acceptAll();
      toast.success("تم تسجيل موافقتك");
    } catch {
      toast.error("تعذّر تسجيل الموافقة");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open modal>
      <DialogContent
        dir="rtl"
        className="max-w-lg p-0 gap-0 overflow-hidden border-2 border-primary/30"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="bg-gradient-gold p-6 text-primary-foreground">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <DialogHeader className="space-y-0 text-right">
              <DialogTitle className="text-xl font-black text-primary-foreground">
                موافقة الاستخدام التعليمي
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80 text-xs">
                نظام الامتثال — الإصدار {COMPLIANCE.TERMS_VERSION}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <ScrollArea className="max-h-[55vh] p-6">
          <div className="space-y-4 text-sm leading-relaxed">
            <div className="flex gap-3 p-3 rounded-xl bg-warning/10 border border-warning/30">
              <GraduationCap className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <p className="font-bold text-foreground">{DISCLAIMER_AR}</p>
            </div>

            <p className="text-muted-foreground">
              لاستخدام منصة ProEdge يرجى الموافقة على البنود التالية. هذه الموافقة موثّقة
              ومسجّلة بموجب أنظمة حماية البيانات الشخصية في المملكة العربية السعودية.
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-border hover:border-primary/40 cursor-pointer transition-colors">
                <Checkbox checked={terms} onCheckedChange={(v) => setTerms(!!v)} className="mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">أوافق على <Link to="/terms" target="_blank" className="text-primary underline">شروط الاستخدام</Link></div>
                  <div className="text-xs text-muted-foreground">الإصدار {COMPLIANCE.TERMS_VERSION}</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-border hover:border-primary/40 cursor-pointer transition-colors">
                <Checkbox checked={privacy} onCheckedChange={(v) => setPrivacy(!!v)} className="mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">أوافق على <Link to="/privacy" target="_blank" className="text-primary underline">سياسة الخصوصية</Link></div>
                  <div className="text-xs text-muted-foreground">الإصدار {COMPLIANCE.PRIVACY_VERSION}</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-border hover:border-primary/40 cursor-pointer transition-colors">
                <Checkbox checked={disclaimer} onCheckedChange={(v) => setDisclaimer(!!v)} className="mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">أُقرّ بالطبيعة التعليمية للمحتوى</div>
                  <div className="text-xs text-muted-foreground">الإصدار {COMPLIANCE.DISCLAIMER_VERSION}</div>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <Lock className="h-3.5 w-3.5" />
              يتم تسجيل وقت الموافقة وعنوان IP لأغراض التوثيق فقط.
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/30">
          <Button
            onClick={handleAccept}
            disabled={!allChecked || submitting}
            variant="gold"
            size="lg"
            className="w-full"
          >
            {submitting ? "جاري التسجيل..." : "موافق ومتابعة"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
