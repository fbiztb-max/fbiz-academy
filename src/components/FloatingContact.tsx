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
      <svg viewBox="0 0 512 512" fill="currentColor" className="h-5 w-5">
        <path d="M256 32c70 0 109 53 109 122 0 11-1 22-2 32 4 2 10 4 17 4 9-1 19-5 26-9 3-2 7-2 10-1l1 0c8 3 14 9 14 17 0 10-9 17-19 22-5 2-13 5-22 7-3 1-4 4-3 7 1 4 8 21 28 41 8 8 19 14 33 19 5 2 8 6 7 11l0 1c-3 12-21 22-58 27-2 3-4 12-6 19-1 5-5 7-11 7l-1 0c-7 0-15-2-29-2-19 0-25 4-39 14-15 11-30 22-56 22-1 0-2 0-3 0-1 0-2 0-3 0-26 0-41-11-56-22-14-10-20-14-39-14-14 0-23 2-29 2l-1 0c-6 0-9-2-11-7-2-7-4-16-6-19-37-5-55-15-58-27l0-1c-1-5 2-9 7-11 14-5 25-11 33-19 20-20 27-37 28-41 1-3 0-6-3-7-9-2-17-5-22-7-13-5-19-13-17-23 1-7 7-13 14-15l1 0c2-1 6-1 9 0 8 4 17 8 26 9 7 0 13-2 17-4-1-10-2-21-2-32 0-69 39-122 109-122z" />
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
