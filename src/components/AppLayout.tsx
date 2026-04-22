import { ReactNode, useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Layers, History, MessageSquare, Newspaper, Users, Bell,
  User as UserIcon, Settings, LogOut, Shield, Menu, X, Moon, Sun
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Brand from "@/components/Brand";

const userNav = [
  { to: "/", icon: LayoutDashboard, label: "اللوحة الرئيسية" },
  { to: "/stages", icon: Layers, label: "المراحل" },
  { to: "/history", icon: History, label: "المراحل السابقة" },
  { to: "/feedback", icon: MessageSquare, label: "الملاحظات" },
  { to: "/news", icon: Newspaper, label: "الأخبار" },
  { to: "/groups", icon: Users, label: "المجموعات" },
];

const adminNav = [
  { to: "/admin", icon: Shield, label: "لوحة الأدمن" },
  { to: "/admin/review", icon: MessageSquare, label: "التصحيح" },
  { to: "/admin/stages", icon: Layers, label: "إدارة المراحل" },
  { to: "/admin/news", icon: Newspaper, label: "إدارة الأخبار" },
  { to: "/admin/groups", icon: Users, label: "إدارة المجموعات" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut, user } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false);
      setUnread(count ?? 0);
    };
    load();
    const channel = supabase.channel("notifs").on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 right-0 h-screen w-72 bg-sidebar border-l border-sidebar-border z-40 transition-transform",
        mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-sidebar-border">
            <Brand size="md" />
          </div>

          <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
            <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-muted-foreground tracking-wide">القائمة</div>
            {userNav.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary shadow-gold-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}

            <NavLink to="/notifications"
              className={({ isActive }) => cn(
                "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}>
              <span className="flex items-center gap-3"><Bell className="h-4 w-4" />الإشعارات</span>
              {unread > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-black rounded-full px-2 py-0.5">{unread}</span>}
            </NavLink>

            {isAdmin && (
              <>
                <div className="px-3 pt-5 pb-1 text-[11px] font-bold text-muted-foreground tracking-wide">إدارة الأدمن</div>
                {adminNav.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.to === "/admin"}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      isActive ? "bg-primary/10 text-primary shadow-gold-sm" : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          <div className="p-3 border-t border-sidebar-border space-y-1">
            <NavLink to="/profile" className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-primary/30" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-gradient-gold flex items-center justify-center text-[11px] font-black text-primary-foreground">
                  {profile?.full_name?.[0] || "؟"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-bold">{profile?.full_name || "مستخدم"}</div>
                <div className="text-[10px] text-muted-foreground">رقم #{profile?.serial_id}</div>
              </div>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              isActive ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
            )}>
              <Settings className="h-4 w-4" /><span>الإعدادات</span>
            </NavLink>
            <button onClick={toggle}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-all">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}</span>
            </button>
            <button onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
              <LogOut className="h-4 w-4" /><span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setMobileOpen(o => !o)} className="p-2 rounded-lg hover:bg-muted">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Brand size="sm" />
            <div />
            <div className="w-9" />
          </div>
        </header>
        <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
