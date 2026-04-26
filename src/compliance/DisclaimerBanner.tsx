import { useLocation } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { DISCLAIMER_AR, INTERACTIVE_ROUTE_PATTERNS } from "./constants";

/**
 * Persistent, unobtrusive educational disclaimer banner.
 * Appears on interactive routes (stages, quizzes, submissions, results, etc.)
 * Sits above content as a thin sticky strip — does not block usability.
 */
export default function DisclaimerBanner() {
  const { pathname } = useLocation();
  const isInteractive = INTERACTIVE_ROUTE_PATTERNS.some((re) => re.test(pathname));
  if (!isInteractive) return null;

  return (
    <div
      role="note"
      dir="rtl"
      className="sticky top-0 z-40 bg-warning/10 backdrop-blur-sm border-b border-warning/30"
    >
      <div className="max-w-6xl mx-auto px-3 py-1.5 flex items-center gap-2 text-[11px] sm:text-xs text-foreground/90">
        <GraduationCap className="h-3.5 w-3.5 text-warning shrink-0" />
        <span className="line-clamp-1 sm:line-clamp-none">
          <span className="font-bold">محتوى تعليمي بحت:</span> {DISCLAIMER_AR}
        </span>
      </div>
    </div>
  );
}
