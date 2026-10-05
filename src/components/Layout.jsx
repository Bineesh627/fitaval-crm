import React, { useState } from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Wallet,
  Tag,
  LayoutGrid,
  Dumbbell,
  Bell,
  Building2,
  Menu,
  X,
  ChevronRight,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { client } from "@/api/client";
import NotificationsDrawer, { useNotifications } from "./NotificationsDrawer";

const desktopNavItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/members", label: "Members", icon: Users },
  { to: "/plans", label: "Plans", icon: Tag },
  { to: "/finance", label: "Finance", icon: Wallet },
  { to: "/settings", label: "Settings", icon: Settings },
];

const mobileBottomNavItems = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/members", label: "Members", icon: Users },
  { to: "/plans", label: "Plans", icon: Tag },
  { to: "/finance", label: "Finance", icon: Wallet },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationState = useNotifications();

  // Derive current screen title for mobile top bar
  const currentTitle = (() => {
    const p = location.pathname;
    if (p === "/") return "Gym Dashboard";
    if (p.startsWith("/members")) return "Members";
    if (p.startsWith("/plans")) return "Membership Plans";
    if (p.startsWith("/trainers")) return "Trainers";
    if (p.startsWith("/gym-profile")) return "Gym Profile";
    if (p.startsWith("/finance")) return "Finance";
    if (p.startsWith("/wallet")) return "Wallet";
    if (p.startsWith("/settings") || p.startsWith("/more")) return "Settings";
    return "Fitaval CRM";
  })();

  return (
    <div className="min-h-screen bg-muted/30 overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-border bg-card z-30">
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
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <item.icon className="w-5 h-5" strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Are you sure you want to log out?")) {
                client.auth.logout("/login");
              }
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
          <div className="rounded-xl bg-accent p-3">
            <p className="text-xs font-semibold text-accent-foreground">Need help?</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">support@fitaval.com</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Compact Mobile & Tablet Top SaaS Header: [☰  Gym Management  🔔] */}
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-3.5 sm:px-6 h-14 sm:h-16">
            {/* Left: Mobile hamburger menu trigger & Brand */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center text-foreground shrink-0 touch-manipulation"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" strokeWidth={2.2} />
              </button>

              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Dumbbell className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-sm sm:text-base text-foreground leading-tight truncate">
                    {currentTitle}
                  </h1>
                  <p className="text-[10px] text-muted-foreground leading-tight hidden xs:block truncate">
                    Fitaval Gym Management
                  </p>
                </div>
              </Link>
            </div>

            {/* Right: Notification & Profile */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                className="relative w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center text-foreground transition-colors touch-manipulation"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notificationState.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 shadow-xs ring-2 ring-white animate-in zoom-in">
                    {notificationState.unreadCount}
                  </span>
                )}
              </button>
              <Link
                to="/settings"
                title="Settings & Profile"
                className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-emerald-600 flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-xs border border-white/10"
              >
                GY
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content: full responsive padding and safe bottom for navigation */}
        <main className="flex-1 px-3 sm:px-6 py-4 pb-24 lg:pb-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer (Accessible via ☰) */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-card h-full shadow-2xl z-10 flex flex-col justify-between border-r border-border animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">Fitaval CRM</p>
                    <p className="text-[10px] text-muted-foreground">Gym Management</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 space-y-1">
                {desktopNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xs font-bold"
                          : "text-foreground hover:bg-muted"
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </NavLink>
                ))}

                {/* Drawer Notification Quick Action */}
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setNotificationsOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-primary" />
                    <span>Notifications</span>
                  </div>
                  {notificationState.unreadCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                      {notificationState.unreadCount} new
                    </span>
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-border space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to log out?")) {
                    client.auth.logout("/login");
                  }
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100/80 dark:bg-red-950/40 dark:hover:bg-red-900/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <div className="rounded-2xl bg-accent/60 p-3 flex items-center gap-2.5 text-xs text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="font-bold text-xs">Fitaval SaaS</p>
                  <p className="text-[10px] text-muted-foreground">Mobile & Desktop v1.2</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation (Always accessible with one-hand) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur-md border-t border-border safe-bottom shadow-lg">
        <div className="flex items-stretch justify-around px-1 h-15">
          {mobileBottomNavItems.map((item) => {
            const active =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to) ||
                  (item.to === "/settings" && location.pathname.startsWith("/more"));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="flex flex-col items-center justify-center gap-1 flex-1 py-1 touch-manipulation min-w-[56px]"
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground scale-105 shadow-xs"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4" strokeWidth={active ? 2.5 : 2} />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold transition-colors leading-none tracking-tight",
                    active ? "text-primary font-bold" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Notifications Drawer */}
      <NotificationsDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notificationState={notificationState}
      />
    </div>
  );
}