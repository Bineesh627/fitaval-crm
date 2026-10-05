import React, { useEffect, useState, useMemo } from "react";
import { client } from "@/api/client";
import { Users, Plus, Search, Phone, Mail, Calendar, UserPlus, Upload, Filter } from "lucide-react";
import { EmptyState, PageHeader, Sheet, Badge } from "@/components/ui-shared";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusFilters = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "expiring", label: "Expiring" },
  { key: "inactive", label: "Inactive" },
];

export default function Members() {
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", phone: "", plan_id: "", start_date: format(new Date(), "yyyy-MM-dd"), source: "manual" });

  useEffect(() => {
    (async () => {
      try {
        const [m, p] = await Promise.all([
          client.entities.Member.list("-created_date", 500),
          client.entities.MembershipPlan.list("-created_date", 50),
        ]);
        setMembers(m);
        setPlans(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.phone?.includes(search) || m.email?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || m.status === filter;
      return matchSearch && matchFilter;
    });
  }, [members, search, filter]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const plan = plans.find((p) => p.id === form.plan_id);
      const start = new Date(form.start_date);
      const expiry = plan ? addDays(start, plan.duration_days) : addDays(start, 30);
      const today = new Date();
      const status = expiry < today ? "inactive" : addDays(expiry, -7) < today ? "expiring" : "active";
      const created = await client.entities.Member.create({
        name: form.name,
        email: form.email,
        phone: form.phone,
        plan_id: form.plan_id,
        plan_name: plan?.name,
        start_date: form.start_date,
        expiry_date: format(expiry, "yyyy-MM-dd"),
        status,
        source: form.source,
      });
      setMembers((prev) => [created, ...prev]);
      setSheetOpen(false);
      setForm({ name: "", email: "", phone: "", plan_id: "", start_date: format(new Date(), "yyyy-MM-dd"), source: "manual" });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to add member");
    } finally {
      setSaving(false);
    }
  };

  const renew = async (member) => {
    const plan = plans.find((p) => p.id === member.plan_id) || plans[0];
    if (!plan) return;
    const newExpiry = addDays(new Date(member.expiry_date || new Date()), plan.duration_days);
    const today = new Date();
    const status = newExpiry < today ? "inactive" : addDays(newExpiry, -7) < today ? "expiring" : "active";
    const updated = await client.entities.Member.update(member.id, {
      expiry_date: format(newExpiry, "yyyy-MM-dd"),
      status,
    });
    setMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)));
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
        title="Members"
        subtitle={`${members.length} total`}
        action={
          <button onClick={() => setSheetOpen(true)} className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, email..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.key ? "bg-primary text-primary-foreground" : "bg-white border border-border text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Member list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description={search || filter !== "all" ? "Try adjusting your filters" : "Add your first member to get started"}
          action={<Button onClick={() => setSheetOpen(true)} className="bg-primary"><Plus className="w-4 h-4 mr-1" />Add Member</Button>}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((m) => (
            <div key={m.id} className="rounded-2xl bg-white border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center font-semibold shrink-0">
                  {m.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground truncate">{m.name}</p>
                    <Badge variant={m.status === "active" ? "green" : m.status === "expiring" ? "amber" : "red"}>
                      {m.status || "active"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.plan_name || "No plan assigned"}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    {m.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</span>}
                    {m.expiry_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Exp: {format(new Date(m.expiry_date), "dd MMM yyyy")}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => renew(m)} className="text-xs font-semibold text-primary px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                      Renew
                    </button>
                    {m.source === "b2c" && <Badge variant="primary">B2C</Badge>}
                    {m.source === "offline" && <Badge>Offline</Badge>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add member sheet */}
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add Member">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <Label>Full Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1.5" placeholder="John Doe" />
          </div>
          <div>
            <Label>Phone *</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="mt-1.5" placeholder="+91 98765 43210" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" placeholder="john@email.com" />
          </div>
          <div>
            <Label>Membership Plan</Label>
            <Select value={form.plan_id} onValueChange={(v) => setForm({ ...form, plan_id: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select plan" /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} — ₹{p.price}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Source</Label>
            <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual entry</SelectItem>
                <SelectItem value="offline">Existing / offline</SelectItem>
                <SelectItem value="b2c">B2C signup</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1.5" />
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-primary text-primary-foreground h-11">
            {saving ? "Saving..." : "Add Member"}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}