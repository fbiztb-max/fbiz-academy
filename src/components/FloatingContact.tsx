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
    color: "bg-[#FFFC00] text-black",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 2c3.2 0 5.6 2.3 5.6 5.7 0 1.3-.1 2.5-.3 3.2.6.3 1.3.4 2 .3.5-.1.8.5.5.9-.6.8-1.6 1.3-2.6 1.6.2.7.6 1.4 1.2 2 .8.7 1.8 1.1 2.9 1.1.4 0 .6.5.3.8-1 1-2.4 1.6-3.9 1.7-.1.4-.2.8-.3 1.2-.1.3-.4.4-.7.4-.6-.1-1.2-.2-1.9-.2-1 0-1.7.2-2.6.9-.9.7-1.8 1.4-3.2 1.4s-2.3-.7-3.2-1.4c-.9-.6-1.6-.9-2.6-.9-.7 0-1.3.1-1.9.2-.3.1-.6-.1-.7-.4-.1-.4-.2-.8-.3-1.2-1.5-.1-2.9-.7-3.9-1.7-.3-.3-.1-.8.3-.8 1.1 0 2.1-.4 2.9-1.1.6-.6 1-1.3 1.2-2-1-.3-2-.8-2.6-1.6-.3-.4 0-1 .5-.9.7.1 1.4 0 2-.3-.2-.7-.3-1.9-.3-3.2C6.4 4.3 8.8 2 12 2z" />
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
