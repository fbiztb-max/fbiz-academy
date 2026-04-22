import logo from "@/assets/fbiz-logo.png";
import { cn } from "@/lib/utils";

interface BrandProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  variant?: "horizontal" | "stacked";
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};

export default function Brand({ size = "md", showText = true, className, variant = "horizontal" }: BrandProps) {
  return (
    <div className={cn(
      "flex items-center gap-3",
      variant === "stacked" && "flex-col gap-2",
      className
    )}>
      <div className={cn(
        "rounded-2xl overflow-hidden ring-1 ring-primary/30 shadow-gold-sm bg-[hsl(217_70%_13%)] flex items-center justify-center shrink-0",
        sizeMap[size]
      )}>
        <img src={logo} alt="شعار FBiz - فراس بزنس" className="w-full h-full object-cover" />
      </div>
      {showText && (
        <div className={cn(variant === "stacked" && "text-center")}>
          <div className="font-black text-base leading-tight tracking-tight">
            <span className="text-gradient-gold">FBiz</span>
            <span className="mx-1.5 text-foreground">أكاديمية</span>
          </div>
          <div className="text-[11px] text-muted-foreground">فراس بزنس · تدريب الأعمال</div>
        </div>
      )}
    </div>
  );
}
