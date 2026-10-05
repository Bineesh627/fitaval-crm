import React from "react";
import { cn } from "@/lib/utils";

/**
 * @param {{ title: string, value: any, icon?: any, accent?: string, subtitle?: string }} props
 */
export default function StatCard({ title, value, icon: Icon, accent = "primary", subtitle = "" }) {
  const accents = {
    primary: "bg-primary/10 text-primary",
    dark: "bg-foreground/10 text-foreground",
    amber: "bg-amber-100 text-amber-600",
    red: "bg-red-100 text-red-600",
    green: "bg-green-100 text-green-600",
  };
  return (
    <div className="rounded-2xl bg-white border border-border p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-xl font-bold text-foreground mt-1 truncate">{value}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", accents[accent])}>
            <Icon className="w-5 h-5" strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  );
}