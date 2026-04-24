import { useState } from "react";
import { MessageCircle, X, Youtube, Instagram } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  {
    label: "يوتيوب",
    href: "https://youtube.com/@fbiz_feras?si=9ljTfrQnMF-zr8Xm",
    color: "bg-[#FF0000] text-white",
    icon: <Youtube className="h-4 w-4" />,
  },
  {
    label: "إنستغرام",
    href: "https://www.instagram.com/fbiz_1?igsh=MXZicDk1a3VmZTB0YQ==",
    color: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white",
    icon: <Instagram className="h-4 w-4" />,
  },
  {
    label: "تيك توك",
    href: "https://www.tiktok.com/@fbiz_1?_r=1&_t=ZS-95XftHr9xvo",
    color: "bg-black text-white",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M19.6 6.3a5.2 5.2 0 0 1-3.1-1.1 5.3 5.3 0 0 1-2-3.2h-3.3v13.4a2.7 2.7 0 1 1-2.7-2.7c.3 0 .6 0 .9.1V9.4a6 6 0 1 0 5.1 5.9V8.9a8.5 8.5 0 0 0 5.1 1.7V7.3c-.3 0-.7 0-1-.1z" />
      </svg>
    ),
  },
  {
    label: "سناب شات",
    href: "https://www.snapchat.com/add/feras2327xx?share_id=LSnqQaCX-oY&locale=ar-SA",
    color: "bg-[#FFFC00] text-white ring-1 ring-black/10",
    icon: (
      <svg viewBox="0 0 512 512" fill="currentColor" className="h-6 w-6 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
        <path d="M255.9 30c-44.5 0-86.7 25.4-104.8 65.5-9.3 20.5-9.3 41.6-9.1 67.4.1 4.2.2 8.6.2 13.1 0 1.1-.4 1.9-1.3 2.5-1.7 1.1-4.6 1.7-7.5 1.1-4-.8-8.7-3-14-6.6-2.5-1.7-5.7-2.6-9.1-2.6-5.5 0-11.4 2.3-15.6 6.4-5.1 5-7 11.6-5 17.6 3.1 9.5 12.3 16.2 30.6 22.4 1.6.5 3.5 1 5.5 1.6 6.7 1.9 16.8 4.7 19.7 11.4 1.5 3.4 1 7.6-1.5 12.6-.4.7-37 73.4-104.5 84.6-3.5.6-6 3.7-5.8 7.3.1 1 .3 2.1.7 3.1 4.7 11 25.7 19 64.1 24.4 1.2 1.7 2.5 7.5 3.2 11 1.4 6.4 2.9 13.1 7.6 14.7 1.8.6 3.9.6 6.5.1 5.6-1 13.5-2.4 23.6-2.4 5.6 0 11.4.5 17.5 1.4 11.5 1.7 21.4 8.3 32.9 16 16.4 11 35 23.4 63.2 23.4.8 0 1.5 0 2.3-.1 1 .1 2.1.1 3.2.1 28.2 0 46.8-12.4 63.2-23.4 11.4-7.7 21.3-14.3 32.9-16 6.1-.9 11.9-1.4 17.5-1.4 9.6 0 17.4 1.2 23.6 2.4 2.7.5 4.7.4 6.5-.1 5-1.5 6.4-7.9 7.7-14.6.7-3.4 2-9.3 3.2-11 38.4-5.4 59.4-13.3 64.1-24.4.4-1 .7-2 .7-3.1.2-3.6-2.3-6.7-5.8-7.3-67.5-11.1-104.1-83.8-104.5-84.6-2.5-5-3-9.2-1.5-12.6 2.9-6.6 13-9.5 19.7-11.4 2-.6 3.9-1.1 5.5-1.6 13.5-4.6 27.3-11.4 30.7-22.5 1.6-5.4-.1-11.6-4.7-16.6-4.6-5-11-7.8-17.4-7.8-2.7 0-5.5.5-8.1 1.7-4.3 2-9.4 4.5-14.4 5.6-3 .7-5.9.1-7.5-1.1-.9-.6-1.3-1.4-1.3-2.5 0-4.5.1-8.9.2-13.1.2-25.8.2-46.9-9.1-67.4C342.6 55.4 300.4 30 255.9 30z"/>
      </svg>
    ),
  },
];

export default function FloatingContact() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col items-start gap-2" dir="ltr">
      <div
        className={cn(
          "flex flex-col gap-2 transition-all origin-bottom-left",
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-2 pointer-events-none"
        )}
      >
        {LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.label}
            className={cn(
              "h-11 w-11 rounded-full shadow-gold-sm hover:shadow-gold flex items-center justify-center transition-transform hover:scale-110",
              l.color
            )}
          >
            {l.icon}
          </a>
        ))}
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "إغلاق التواصل" : "تواصل معنا"}
        className="h-13 w-13 h-12 w-12 rounded-full bg-gradient-gold text-primary-foreground shadow-gold flex items-center justify-center hover:brightness-110 transition-all active:scale-95"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
