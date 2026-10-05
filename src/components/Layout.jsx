import React from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import { Home, Users, Wallet, Tag, LayoutGrid, Dumbbell, Bell, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const desktopNavItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/members", label: "Members", icon: Users },
  { to: "/plans", label: "Plans", icon: Tag },
  { to: "/trainers", label: "Trainers", icon: Dumbbell },
  { to: "/gym-profile", label: "Gym Profile", icon: Building2 },
  { to: "/finance", label: "Finance", icon: Wallet },
  { to: "/more", label: "More", icon: LayoutGrid },
];

const mobileNavItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/members", label: "Members", icon: Users },
  { to: "/plans", label: "Plans", icon: Tag },
  { to: "/trainers", label: "Trainers", icon: Dumbbell },
  { to: "/more", label: "More", icon: LayoutGrid },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border bg-white z-30">
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Dumbbell className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-bold text-foreground leading-tight">Fitaval</p>
            <p className="text-[11px] text-muted-foreground leading-tight">Gym Manager</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {desktopNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <item.icon className="w-5 h-5" strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="rounded-xl bg-accent p-3">
            <p className="text-xs font-semibold text-accent-foreground">Need help?</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">support@fitaval.com</p>
          </div>
        </div>
      </aside>

      {/* Mobile / desktop content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="lg:hidden w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="font-bold text-foreground leading-tight">Fitaval</h1>
                <p className="text-[11px] text-muted-foreground leading-tight hidden sm:block">Gym Business Manager</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <button className="relative w-10 h-10 rounded-full hover:bg-accent flex items-center justify-center transition-colors">
                <Bell className="w-5 h-5 text-foreground" />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />
              </button>
              <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-white text-sm font-semibold">
                GY
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 lg:px-8 py-5 pb-28 lg:pb-8 max-w-5xl mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-lg border-t border-border safe-bottom">
        <div className="flex items-stretch justify-around px-2 h-16">
          {mobileNavItems.map((item) => {
            const active =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex flex-col items-center justify-center gap-1 flex-1 py-1.5"
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200",
                    active ? "bg-primary text-primary-foreground scale-105" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}