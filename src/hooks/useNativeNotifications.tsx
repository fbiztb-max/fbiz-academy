// إشعارات حقيقية: داخل APK تستخدم Capacitor LocalNotifications (تظهر في شريط الإشعارات)،
// وفي المتصفح تستخدم Web Notifications API (تظهر في إشعارات النظام إذا أذِن المستخدم).
// تُنشأ تلقائياً عند إدراج صف جديد في جدول notifications للمستخدم الحالي.
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LocalNotifications } from "@capacitor/local-notifications";
import { isNative } from "@/lib/platform";

let permissionRequested = false;

export async function ensureNotificationPermission() {
  if (permissionRequested) return;
  permissionRequested = true;
  try {
    if (isNative()) {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== "granted") await LocalNotifications.requestPermissions();
    } else if ("Notification" in window && Notification.permission === "default") {
      try { await Notification.requestPermission(); } catch {}
    }
  } catch {}
}

async function fireNotification(title: string, body: string, link?: string | null) {
  try {
    if (isNative()) {
      await LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(Math.random() * 2_147_000_000),
          title,
          body: body || "",
          schedule: { at: new Date(Date.now() + 50) },
          extra: { link },
          smallIcon: "ic_stat_icon_config_sample",
        }],
      });
    } else if ("Notification" in window && Notification.permission === "granted") {
      const n = new Notification(title, { body, tag: link ?? undefined, icon: "/favicon.ico" });
      if (link) n.onclick = () => { window.focus(); window.location.href = link; };
    }
  } catch {}
}

export function useNativeNotifications() {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;
    ensureNotificationPermission();

    const ch = supabase.channel(`native-notifs-${user.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n: any = payload.new;
          fireNotification(n.title, n.body ?? "", n.link);
        }
      ).subscribe();
    channelRef.current = ch;

    return () => { try { supabase.removeChannel(ch); } catch {} };
  }, [user?.id]);
}
