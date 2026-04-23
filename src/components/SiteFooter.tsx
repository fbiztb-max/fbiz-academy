import { Link } from "react-router-dom";
import { Youtube, Instagram } from "lucide-react";

const SOCIALS = [
  {
    label: "يوتيوب",
    href: "https://youtube.com/@fbiz_feras?si=9ljTfrQnMF-zr8Xm",
    icon: Youtube,
  },
  {
    label: "إنستغرام",
    href: "https://www.instagram.com/fbiz_1?igsh=MXZicDk1a3VmZTB0YQ==",
    icon: Instagram,
  },
  {
    label: "تيك توك",
    href: "https://www.tiktok.com/@fbiz_1?_r=1&_t=ZS-95XftHr9xvo",
    // Lucide doesn't have TikTok – use inline svg
    icon: (props: any) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19.6 6.3a5.2 5.2 0 0 1-3.1-1.1 5.3 5.3 0 0 1-2-3.2h-3.3v13.4a2.7 2.7 0 1 1-2.7-2.7c.3 0 .6 0 .9.1V9.4a6 6 0 1 0 5.1 5.9V8.9a8.5 8.5 0 0 0 5.1 1.7V7.3c-.3 0-.7 0-1-.1z" />
      </svg>
    ),
  },
  {
    label: "سناب شات",
    href: "https://www.snapchat.com/add/feras2327xx?share_id=LSnqQaCX-oY&locale=ar-SA",
    icon: (props: any) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2c3.2 0 5.6 2.3 5.6 5.7 0 1.3-.1 2.5-.3 3.2.6.3 1.3.4 2 .3.5-.1.8.5.5.9-.6.8-1.6 1.3-2.6 1.6.2.7.6 1.4 1.2 2 .8.7 1.8 1.1 2.9 1.1.4 0 .6.5.3.8-1 1-2.4 1.6-3.9 1.7-.1.4-.2.8-.3 1.2-.1.3-.4.4-.7.4-.6-.1-1.2-.2-1.9-.2-1 0-1.7.2-2.6.9-.9.7-1.8 1.4-3.2 1.4s-2.3-.7-3.2-1.4c-.9-.6-1.6-.9-2.6-.9-.7 0-1.3.1-1.9.2-.3.1-.6-.1-.7-.4-.1-.4-.2-.8-.3-1.2-1.5-.1-2.9-.7-3.9-1.7-.3-.3-.1-.8.3-.8 1.1 0 2.1-.4 2.9-1.1.6-.6 1-1.3 1.2-2-1-.3-2-.8-2.6-1.6-.3-.4 0-1 .5-.9.7.1 1.4 0 2-.3-.2-.7-.3-1.9-.3-3.2C6.4 4.3 8.8 2 12 2z" />
      </svg>
    ),
  },
];

export default function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-sidebar/40 backdrop-blur" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">تابعنا:</span>
          {SOCIALS.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
              className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-gold-sm"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        <div className="text-[11px] text-muted-foreground text-center md:text-right leading-relaxed">
          <div className="font-bold text-foreground">© {new Date().getFullYear()} أكاديمية FBiz — جميع الحقوق محفوظة.</div>
          <div className="mt-1">
            تابعة لقناة "فراس بزنس" — مرخّصة وفق أنظمة الدول العربية لحماية البيانات والمعاملات الإلكترونية.
            {" "}
            <Link to="/terms" className="text-primary hover:underline">الشروط</Link>
            {" · "}
            <Link to="/privacy" className="text-primary hover:underline">الخصوصية</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
