import { supabase } from "@/integrations/supabase/client";

// Persistent session id (per browser tab session)
const SESSION_KEY = "fbiz_session_id";
export function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// Best-effort IP fetch (cached)
let cachedIp: string | null = null;
export async function getClientIp(): Promise<string | null> {
  if (cachedIp !== null) return cachedIp;
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const j = await res.json();
    cachedIp = j.ip ?? null;
  } catch {
    cachedIp = null;
  }
  return cachedIp;
}

// Lightweight, fire-and-forget audit log
const recentLogs = new Map<string, number>(); // dedupe within 3s
export async function audit(
  action_type: string,
  resource?: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const key = `${action_type}|${resource ?? ""}`;
    const now = Date.now();
    const last = recentLogs.get(key) ?? 0;
    if (now - last < 3000) return;
    recentLogs.set(key, now);

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      session_id: getSessionId(),
      action_type,
      resource: resource ?? null,
      metadata: metadata as never,
    });
  } catch {
    // never block UI on audit failure
  }
}
