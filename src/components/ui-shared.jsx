import React from "react";
import { cn } from "@/lib/utils";

/**
 * @param {{ icon?: any, title?: string, description?: string, action?: any }} props
 */
export function EmptyState({ icon: Icon = null, title = "", description = "", action = null }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-3">
          <Icon className="w-7 h-7 text-accent-foreground" strokeWidth={1.8} />
        </div>
      )}
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * @param {{ title: string, subtitle?: any, action?: any }} props
 */
export function PageHeader({ title = "", subtitle = null, action = null }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Sheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom">
        <div className="sticky top-0 bg-white px-5 pt-4 pb-3 border-b border-border rounded-t-3xl">
          <div className="w-10 h-1.5 bg-border rounded-full mx-auto mb-3 sm:hidden" />
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground">
              ✕
            </button>
          </div>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ children, variant = "default" }) {
  const variants = {
    default: "bg-secondary text-secondary-foreground",
    primary: "bg-primary/10 text-primary",
    dark: "bg-foreground text-white",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    green: "bg-green-100 text-green-700",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", variants[variant])}>
      {children}
    </span>
  );
}