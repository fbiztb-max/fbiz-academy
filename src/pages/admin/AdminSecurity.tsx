import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, ShieldAlert, FileText, Trash2, Activity,
  CheckCircle2, XCircle, Search, Printer, Loader2,
} from "lucide-react";
import { COMPLIANCE } from "@/compliance/constants";
import { toast } from "sonner";

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  serial_id: number;
}
interface ConsentRow {
  user_id: string;
  created_at: string;
  terms_version: string;
  privacy_version: string;
  disclaimer_version: string;
}
interface AuditRow {
  id: string;
  user_id: string;
  action_type: string;
  resource: string | null;
  session_id: string;
  created_at: string;
}
interface DeletionRow {
  id: string;
  user_id: string;
  status: string;
  reason: string | null;
  created_at: string;
}

export default function AdminSecurity() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [deletions, setDeletions] = useState<DeletionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reportUserId, setReportUserId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: ps }, { data: cs }, { data: as }, { data: ds }] = await Promise.all([
      supabase.from("profiles").select("user_id,full_name,email,serial_id").order("serial_id"),
      supabase.from("user_consents").select("user_id,created_at,terms_version,privacy_version,disclaimer_version").order("created_at", { ascending: false }),
      supabase.from("audit_logs").select("id,user_id,action_type,resource,session_id,created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("data_deletion_requests").select("id,user_id,status,reason,created_at").order("created_at", { ascending: false }),
    ]);
    setProfiles((ps as ProfileRow[]) ?? []);
    setConsents((cs as ConsentRow[]) ?? []);
    setAudits((as as AuditRow[]) ?? []);
    setDeletions((ds as DeletionRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const latestConsent = useMemo(() => {
    const map = new Map<string, ConsentRow>();
    for (const c of consents) if (!map.has(c.user_id)) map.set(c.user_id, c);
    return map;
  }, [consents]);

  const lastActivity = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of audits) if (!map.has(a.user_id)) map.set(a.user_id, a.created_at);
    return map;
  }, [audits]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.email?.toLowerCase().includes(q) ||
        p.full_name?.toLowerCase().includes(q) ||
        String(p.serial_id).includes(q)
    );
  }, [profiles, search]);

  const stats = {
    total: profiles.length,
    consented: profiles.filter((p) => latestConsent.has(p.user_id)).length,
    actions: audits.length,
    pendingDeletions: deletions.filter((d) => d.status === "pending").length,
  };

  const generateReport = async (userId: string) => {
    setGenerating(true);
    setReportUserId(userId);
    setGenerating(false);
    setTimeout(() => window.print(), 200);
  };

  const processDeletion = async (id: string, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("data_deletion_requests")
      .update({ status, processed_at: new Date().toISOString(), processed_by: user?.id ?? null })
      .eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "approved" ? "تمت الموافقة على الطلب" : "تم رفض الطلب");
    load();
  };

  const reportProfile = profiles.find((p) => p.user_id === reportUserId);
  const reportConsents = consents.filter((c) => c.user_id === reportUserId);
  const reportAudits = audits.filter((a) => a.user_id === reportUserId);

  return (
    <AppLayout>
      <style>{`@media print { .no-print { display: none !important; } .print-only { display: block !important; } body { background: white; } }`}</style>

      <div className="no-print">
        <div className="mb-6">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" /> الأمان والامتثال
          </h1>
          <p className="text-muted-foreground">لوحة مراقبة الامتثال والخصوصية للأدمن فقط</p>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatusCard label="نظام الموافقة" active version={COMPLIANCE.TERMS_VERSION} />
          <StatusCard label="نظام التسجيل" active version="audit_logs" />
          <StatusCard label="الإقرار التعليمي" active version={COMPLIANCE.DISCLAIMER_VERSION} />
          <StatusCard label="حماية البيانات" active version="PDPL" />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Kpi label="إجمالي المستخدمين" value={stats.total} />
          <Kpi label="المستخدمون الموافقون" value={stats.consented} />
          <Kpi label="عمليات مسجّلة" value={stats.actions} />
          <Kpi label="طلبات حذف معلّقة" value={stats.pendingDeletions} tone={stats.pendingDeletions ? "warn" : "ok"} />
        </div>

        {/* Deletion Requests */}
        {deletions.length > 0 && (
          <div className="surface-card p-4 mb-6">
            <h3 className="font-black mb-3 flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" /> طلبات حذف البيانات (PDPL)
            </h3>
            <div className="space-y-2">
              {deletions.map((d) => {
                const p = profiles.find((x) => x.user_id === d.user_id);
                return (
                  <div key={d.id} className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-muted/40 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{p?.full_name || "—"} • #{p?.serial_id ?? "?"}</div>
                      <div className="text-xs text-muted-foreground truncate">{d.reason || "بدون سبب"}</div>
                    </div>
                    <Badge variant={d.status === "pending" ? "secondary" : d.status === "approved" ? "default" : "destructive"}>
                      {d.status === "pending" ? "معلّق" : d.status === "approved" ? "تمت الموافقة" : "مرفوض"}
                    </Badge>
                    {d.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => processDeletion(d.id, "approved")}>موافقة</Button>
                        <Button size="sm" variant="ghost" onClick={() => processDeletion(d.id, "rejected")}>رفض</Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User Compliance Logs */}
        <div className="surface-card p-4 mb-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className="font-black flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> سجل امتثال المستخدمين
            </h3>
            <div className="relative">
              <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className="pr-9 w-44 h-9" />
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></div>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto scrollbar-thin">
              {filtered.map((p) => {
                const c = latestConsent.get(p.user_id);
                const last = lastActivity.get(p.user_id);
                return (
                  <div key={p.user_id} className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-muted/40 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{p.full_name || "—"} <span className="text-muted-foreground text-xs">#{p.serial_id}</span></div>
                      <div className="text-[11px] text-muted-foreground truncate font-mono">{p.user_id.slice(0, 8)}…</div>
                    </div>
                    <div className="text-xs text-center">
                      {c ? (
                        <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" /> {new Date(c.created_at).toLocaleDateString("ar")}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground"><XCircle className="h-3 w-3" /> لم يوافق</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground hidden sm:block min-w-[70px] text-center">
                      {last ? new Date(last).toLocaleDateString("ar") : "—"}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => generateReport(p.user_id)} disabled={generating}>
                      <Printer className="h-3 w-3" /> تقرير
                    </Button>
                  </div>
                );
              })}
              {filtered.length === 0 && <div className="text-center py-6 text-sm text-muted-foreground">لا توجد نتائج</div>}
            </div>
          )}
        </div>

        {/* Activity Tracking */}
        <div className="surface-card p-4">
          <h3 className="font-black mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> آخر النشاطات (200 سجل)
          </h3>
          <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin text-xs">
            {audits.map((a) => {
              const p = profiles.find((x) => x.user_id === a.user_id);
              return (
                <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40">
                  <Badge variant="outline" className="font-mono text-[10px] shrink-0">{a.action_type}</Badge>
                  <span className="text-muted-foreground truncate flex-1">{a.resource || "—"}</span>
                  <span className="hidden sm:inline truncate max-w-[100px] font-bold">{p?.full_name || a.user_id.slice(0, 6)}</span>
                  <span className="text-muted-foreground font-mono text-[10px] shrink-0">{a.session_id.slice(0, 6)}</span>
                  <span className="text-muted-foreground shrink-0">{new Date(a.created_at).toLocaleString("ar")}</span>
                </div>
              );
            })}
            {audits.length === 0 && <div className="text-center py-4 text-muted-foreground">لا توجد نشاطات</div>}
          </div>
        </div>
      </div>

      {/* Printable Full Report */}
      {reportUserId && reportProfile && (
        <div className="hidden print:block print-only p-8" dir="rtl">
          <h1 className="text-2xl font-black border-b-2 border-black pb-2 mb-4">تقرير الامتثال الكامل — منصة ProEdge</h1>
          <div className="mb-6 text-sm">
            <p><b>المستخدم:</b> {reportProfile.full_name} (#{reportProfile.serial_id})</p>
            <p><b>البريد:</b> {reportProfile.email}</p>
            <p><b>المعرّف:</b> {reportProfile.user_id}</p>
            <p><b>تاريخ التقرير:</b> {new Date().toLocaleString("ar")}</p>
          </div>

          <h2 className="text-lg font-black mb-2">سجلات الموافقة ({reportConsents.length})</h2>
          <table className="w-full text-xs border-collapse mb-6">
            <thead><tr className="bg-muted"><th className="border p-2">التاريخ</th><th className="border p-2">شروط</th><th className="border p-2">خصوصية</th><th className="border p-2">إقرار</th></tr></thead>
            <tbody>
              {reportConsents.map((c, i) => (
                <tr key={i}><td className="border p-2">{new Date(c.created_at).toLocaleString("ar")}</td><td className="border p-2">{c.terms_version}</td><td className="border p-2">{c.privacy_version}</td><td className="border p-2">{c.disclaimer_version}</td></tr>
              ))}
            </tbody>
          </table>

          <h2 className="text-lg font-black mb-2">جميع التفاعلات ({reportAudits.length})</h2>
          <table className="w-full text-xs border-collapse">
            <thead><tr className="bg-muted"><th className="border p-2">الوقت</th><th className="border p-2">الإجراء</th><th className="border p-2">المورد</th><th className="border p-2">الجلسة</th></tr></thead>
            <tbody>
              {reportAudits.map((a) => (
                <tr key={a.id}><td className="border p-2">{new Date(a.created_at).toLocaleString("ar")}</td><td className="border p-2">{a.action_type}</td><td className="border p-2">{a.resource || "—"}</td><td className="border p-2 font-mono">{a.session_id.slice(0,8)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}

function StatusCard({ label, active, version }: { label: string; active: boolean; version: string }) {
  return (
    <div className="surface-card p-3 flex items-center gap-3">
      <div className={`h-9 w-9 rounded-full flex items-center justify-center ${active ? "bg-success/15" : "bg-destructive/15"}`}>
        {active ? <ShieldCheck className="h-4 w-4 text-success" /> : <ShieldAlert className="h-4 w-4 text-destructive" />}
      </div>
      <div className="min-w-0">
        <div className="font-bold text-sm truncate">{label}</div>
        <div className="text-[10px] text-muted-foreground font-mono truncate">{active ? "نشط" : "متوقف"} • {version}</div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone = "ok" }: { label: string; value: number; tone?: "ok" | "warn" }) {
  return (
    <div className="surface-card p-4">
      <div className="text-xs text-muted-foreground font-bold">{label}</div>
      <div className={`text-3xl font-black ${tone === "warn" ? "text-warning" : "text-primary"}`}>{value}</div>
    </div>
  );
}
