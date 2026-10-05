import React, { useEffect, useState } from "react";
import { client } from "@/api/client";
import { Plus, Tag, Check, Clock, IndianRupee } from "lucide-react";
import { EmptyState, PageHeader, Sheet, Badge } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", duration_days: 30, price: "", benefits: "", is_active: true });

  useEffect(() => {
    (async () => {
      try {
        const p = await client.entities.MembershipPlan.list("-created_date", 100);
        setPlans(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await client.entities.MembershipPlan.create({
        name: form.name,
        duration_days: parseInt(form.duration_days),
        price: parseFloat(form.price),
        benefits: form.benefits,
        is_active: form.is_active,
      });
      setPlans((prev) => [created, ...prev]);
      setSheetOpen(false);
      setForm({ name: "", duration_days: 30, price: "", benefits: "", is_active: true });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to add plan");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan) => {
    const updated = await client.entities.MembershipPlan.update(plan.id, { is_active: !plan.is_active });
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? updated : p)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Membership Plans"
        subtitle={`${plans.length} plans`}
        action={
          <button onClick={() => setSheetOpen(true)} className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </button>
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No plans yet"
          description="Create membership plans with duration, pricing and benefits"
          action={<Button onClick={() => setSheetOpen(true)} className="bg-primary"><Plus className="w-4 h-4 mr-1" />Create Plan</Button>}
        />
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className={`rounded-2xl border p-5 transition-colors ${p.is_active ? "bg-white border-border" : "bg-muted/50 border-border"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">{p.name}</h3>
                    {!p.is_active && <Badge variant="red">Inactive</Badge>}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <IndianRupee className="w-5 h-5 text-primary" />
                    <span className="text-2xl font-bold text-primary">{(p.price || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                  <Clock className="w-3 h-3" />{p.duration_days} days
                </span>
              </div>
              {p.benefits && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">Benefits</p>
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap">{p.benefits}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Create Membership Plan">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <Label>Plan Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1.5" placeholder="e.g. Monthly Premium" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Duration (days) *</Label>
              <Input type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} required className="mt-1.5" />
            </div>
            <div>
              <Label>Price (₹) *</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="mt-1.5" placeholder="0" />
            </div>
          </div>
          <div>
            <Label>Benefits</Label>
            <Textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} className="mt-1.5" placeholder="One benefit per line&#10;e.g. Full gym access&#10;2 group classes" rows={4} />
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-primary text-primary-foreground h-11">
            {saving ? "Saving..." : "Create Plan"}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}