// مرفقات شات: تعرض الصور كصورة فعلية، والملفات الأخرى كرابط بأيقونة.
import { FileIcon, ImageIcon } from "lucide-react";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|heic|heif|svg|avif)(\?|$)/i;

export function isImageUrl(url: string | null | undefined, fileName?: string | null): boolean {
  if (!url) return false;
  if (fileName && IMAGE_EXT.test(fileName)) return true;
  return IMAGE_EXT.test(url);
}

interface Props {
  url: string;
  name?: string | null;
  className?: string;
}

export default function ChatAttachment({ url, name, className }: Props) {
  if (isImageUrl(url, name)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={`block ${className ?? ""}`}>
        <img
          src={url}
          alt={name ?? "صورة مرفقة"}
          loading="lazy"
          className="rounded-xl max-h-72 w-auto max-w-full object-cover border border-border/40 shadow-sm"
        />
        {name && <div className="text-[10px] mt-1 opacity-70 inline-flex items-center gap-1"><ImageIcon className="h-3 w-3"/>{name}</div>}
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 underline text-sm">
      <FileIcon className="h-4 w-4" /> {name || "ملف مرفق"}
    </a>
  );
}
