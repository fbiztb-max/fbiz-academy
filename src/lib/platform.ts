// Helpers لاكتشاف بيئة التشغيل (ويب / تطبيق APK عبر Capacitor)
import { Capacitor } from "@capacitor/core";

export const isNative = (): boolean => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

export const platformName = (): string => {
  try { return Capacitor.getPlatform(); } catch { return "web"; }
};

// عنوان الويب الرسمي للموقع — يُستخدم كـ redirect_uri عند تسجيل الدخول داخل التطبيق،
// لأن window.location.origin داخل APK يكون capacitor://localhost ولا يعمل مع Google OAuth.
export const PUBLIC_WEB_URL = "https://fbiz-academy.lovable.app";

export const oauthRedirectUri = (): string => {
  return isNative() ? PUBLIC_WEB_URL : window.location.origin;
};
