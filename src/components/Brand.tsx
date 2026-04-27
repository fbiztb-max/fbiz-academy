import logoDark from "@/assets/proedge-logo-dark.png";
import logoLight from "@/assets/proedge-logo-light.png";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

interface BrandProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  variant?: "horizontal" | "stacked";
}

const sizeMap = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
};

export default function Brand({ size = "md", showText = true, className, variant = "horizontal" }: BrandProps) {
  const { theme } = useTheme();
  const logo = theme === "light" ? logoLight : logoDark;

  return (
    <div className={cn(
      "flex items-center gap-3 group",
      variant === "stacked" && "flex-col gap-2",
      className
    )}>
      <div className={cn(
        "relative rounded-2xl overflow-hidden flex items-center justify-center shrink-0 transition-all duration-500",
        "ring-1 ring-primary/40 shadow-gold-sm",
        "bg-[hsl(0_0%_4%)] dark:bg-[hsl(0_0%_4%)]",
        "group-hover:shadow-gold group-hover:ring-primary/70 group-hover:scale-105",
        sizeMap[size]
      )}>
        <img src={logo} alt="شعار ProEdge" className="w-full h-full object-contain p-1" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      {showText && (
        <div className={cn("leading-tight", variant === "stacked" && "text-center")} dir="ltr">
          <div className="font-black text-base tracking-wide flex items-baseline gap-1 justify-start">
            <span className="text-gradient-gold font-black text-lg">Pro</span>
            <span className="text-foreground font-black text-lg">Edge</span>
          </div>
          <div className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">Executive Training</div>
        </div>
      )}
    </div>
  );
}
