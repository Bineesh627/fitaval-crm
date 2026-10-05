import React from "react";
import { Link } from "react-router-dom";
import { Building2, Dumbbell, Wallet, Settings, ChevronRight, HelpCircle, Star } from "lucide-react";
import { PageHeader } from "@/components/ui-shared";

const menuItems = [
  { to: "/gym-profile", label: "Gym Profile", desc: "Logo, address, amenities & gallery", icon: Building2, color: "bg-primary/10 text-primary" },
  { to: "/trainers", label: "Trainers", desc: "Manage trainer profiles & specializations", icon: Dumbbell, color: "bg-foreground/10 text-foreground" },
  { to: "/wallet", label: "Fitaval Wallet", desc: "B2C revenue, settlements & withdrawals", icon: Wallet, color: "bg-green-100 text-green-600" },
];

export default function More() {
  return (
    <div>
      <PageHeader title="More" subtitle="Manage your gym business" />

      {/* Profile card */}
      <div className="rounded-2xl bg-gradient-to-br from-foreground to-foreground/80 text-white p-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-xl font-bold">
            GY
          </div>
          <div>
            <p className="font-bold text-lg">Gym Owner</p>
            <p className="text-white/60 text-sm">admin@fitaval.com</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2.5 mb-5">
        {menuItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 rounded-2xl bg-white border border-border p-4 hover:shadow-sm transition-shadow"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
              <item.icon className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>

      {/* Secondary menu */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-3 rounded-2xl bg-white border border-border p-4">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Rate Fitaval</p>
            <p className="text-xs text-muted-foreground">Help us improve</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-white border border-border p-4">
          <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Help & Support</p>
            <p className="text-xs text-muted-foreground">FAQs, contact us</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">Fitaval Gym Manager v1.0</p>
    </div>
  );
}