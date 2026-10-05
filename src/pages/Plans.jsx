import React, { useEffect, useState, useMemo } from "react";
import { client } from "@/api/client";
import {
  Tag,
  Plus,
  Clock,
  IndianRupee,
  Check,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  Users,
  Calendar,
  Layers,
  X,
  Sparkles,
} from "lucide-react";
import { EmptyState, PageHeader, Badge } from "@/components/ui-shared";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

const DURATION_UNITS = [
  { unit: "Days", multiplier: 1 },
  { unit: "Weeks", multiplier: 7 },
  { unit: "Months", multiplier: 30 },
  { unit: "Years", multiplier: 365 },
];

export default function Plans() {
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  // Operations state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Benefit dynamic chip input
  const [benefitInput, setBenefitInput] = useState("");

  const initialForm = {
    id: null,
    name: "",
    price: "",
    duration_value: "30",
    duration_unit: "Days",
    duration_days: 30,
    benefitsList: [],
    description: "",
    is_active: true,
  };
  const [form, setForm] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [p, m] = await Promise.all([
        client.entities.MembershipPlan.list("-created_date", 100),
        client.entities.Member.list("-created_date", 500),
      ]);
      setPlans(p);
      setMembers(m);
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to load plans",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute active members per plan
  const memberCountByPlan = useMemo(() => {
    const counts = {};
    members.forEach((m) => {
      if (m.plan_id) {
        counts[m.plan_id] = (counts[m.plan_id] || 0) + 1;
      }
    });
    return counts;
  }, [members]);

  const calculateDays = (value, unit) => {
    const val = parseInt(value, 10) || 1;
    switch (unit) {
      case "Weeks":
        return val * 7;
      case "Months":
        return val * 30;
      case "Years":
        return val * 365;
      case "Days":
      default:
        return val;
    }
  };

  const openAddModal = () => {
    setForm({
      ...initialForm,
      benefitsList: [
        "Unlimited gym floor access",
        "Locker and shower room use",
        "Free initial fitness assessment",
      ],
    });
    setBenefitInput("");
    setIsEditMode(false);
    setFormModalOpen(true);
  };

  const openEditModal = (plan) => {
    const rawBenefits = plan.benefits || "";
    const list = rawBenefits
      ? rawBenefits
          .split("\n")
          .map((b) => b.trim())
          .filter(Boolean)
      : [];

    setForm({
      id: plan.id,
      name: plan.name || "",
      price: plan.price?.toString() || "",
      duration_value: plan.duration_value?.toString() || plan.duration_days?.toString() || "30",
      duration_unit: plan.duration_unit || "Days",
      duration_days: plan.duration_days || 30,
      benefitsList: list,
      description: plan.description || "",
      is_active: plan.is_active ?? true,
    });
    setBenefitInput("");
    setIsEditMode(true);
    setFormModalOpen(true);
    if (viewModalOpen) setViewModalOpen(false);
  };

  const openViewModal = (plan) => {
    setSelectedPlan(plan);
    setViewModalOpen(true);
  };

  const handleAddBenefit = () => {
    const trimmed = benefitInput.trim();
    if (trimmed && !form.benefitsList.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        benefitsList: [...prev.benefitsList, trimmed],
      }));
      setBenefitInput("");
    }
  };

  const handleRemoveBenefit = (index) => {
    setForm((prev) => ({
      ...prev,
      benefitsList: prev.benefitsList.filter((_, i) => i !== index),
    }));
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast({
        title: "Validation error",
        description: "Plan name and price are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const durationDays = calculateDays(form.duration_value, form.duration_unit);
      const combinedBenefits = form.benefitsList.join("\n");

      const payload = {
        name: form.name.trim(),
        price: parseFloat(form.price) || 0,
        duration_value: parseInt(form.duration_value, 10) || 1,
        duration_unit: form.duration_unit,
        duration_days: durationDays,
        benefits: combinedBenefits,
        description: form.description,
        is_active: form.is_active,
        updated_date: format(new Date(), "yyyy-MM-dd"),
      };

      if (isEditMode && form.id) {
        const updated = await client.entities.MembershipPlan.update(form.id, payload);
        setPlans((prev) => prev.map((p) => (p.id === form.id ? updated : p)));
        if (selectedPlan?.id === form.id) {
          setSelectedPlan(updated);
        }
        toast({
          title: "Membership plan updated",
          description: `${updated.name} has been updated successfully.`,
        });
      } else {
        const created = await client.entities.MembershipPlan.create(payload);
        setPlans((prev) => [created, ...prev]);
        toast({
          title: "Membership plan created",
          description: `${created.name} is now available for new memberships.`,
        });
      }

      setFormModalOpen(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to save plan",
        description: err.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan) => {
    try {
      const nextStatus = !plan.is_active;
      const updated = await client.entities.MembershipPlan.update(plan.id, {
        is_active: nextStatus,
      });
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? updated : p)));
      if (selectedPlan?.id === plan.id) {
        setSelectedPlan(updated);
      }
      toast({
        title: nextStatus ? "Plan activated" : "Plan deactivated",
        description: `${plan.name} is now ${nextStatus ? "active" : "inactive"}.`,
      });
    } catch (err) {
      toast({
        title: "Status change failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const promptDeletePlan = (plan) => {
    setPlanToDelete(plan);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    setDeleting(true);
    try {
      await client.entities.MembershipPlan.delete(planToDelete.id);
      setPlans((prev) => prev.filter((p) => p.id !== planToDelete.id));
      if (selectedPlan?.id === planToDelete.id) {
        setViewModalOpen(false);
        setSelectedPlan(null);
      }
      toast({
        title: "Plan deleted",
        description: `${planToDelete.name} was removed.`,
      });
      setDeleteConfirmOpen(false);
      setPlanToDelete(null);
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivateInstead = async () => {
    if (!planToDelete) return;
    setDeleting(true);
    try {
      const updated = await client.entities.MembershipPlan.update(planToDelete.id, {
        is_active: false,
      });
      setPlans((prev) => prev.map((p) => (p.id === planToDelete.id ? updated : p)));
      if (selectedPlan?.id === planToDelete.id) {
        setSelectedPlan(updated);
      }
      toast({
        title: "Plan deactivated",
        description: `${planToDelete.name} was marked inactive to preserve assigned members.`,
      });
      setDeleteConfirmOpen(false);
      setPlanToDelete(null);
    } catch (err) {
      toast({
        title: "Deactivation failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-9 h-9 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Loading Membership Plans...</p>
      </div>
    );
  }

  const assignedMembersCount = planToDelete ? memberCountByPlan[planToDelete.id] || 0 : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Membership Plans"
        subtitle={`${plans.length} configured plans • ${plans.filter((p) => p.is_active).length} active`}
        action={
          <Button
            onClick={openAddModal}
            className="bg-primary text-primary-foreground gap-1.5 rounded-xl shadow-sm hover:bg-primary/90 h-10 px-4 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Add Plan</span>
          </Button>
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No membership plans yet"
          description="Create membership tiers with flexible durations (days, weeks, months, years) and customizable member benefits."
          action={
            <Button onClick={openAddModal} className="bg-primary text-white rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" />
              Create First Plan
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((p) => {
            const memberCount = memberCountByPlan[p.id] || 0;
            const benefitsList = (p.benefits || "")
              .split("\n")
              .map((b) => b.trim())
              .filter(Boolean);

            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                  p.is_active
                    ? "bg-white border-border shadow-xs"
                    : "bg-muted/40 border-border/70 opacity-90"
                }`}
              >
                <div>
                  {/* Card Header: Name, Price, Switch */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openViewModal(p)}
                          className="font-bold text-foreground text-base hover:text-primary transition-colors text-left truncate"
                        >
                          {p.name}
                        </button>
                        <Badge variant={p.is_active ? "green" : "red"} className="text-[10px]">
                          {p.is_active ? "ON" : "OFF"}
                        </Badge>
                      </div>

                      <div className="flex items-baseline gap-1 mt-1.5">
                        <IndianRupee className="w-4 h-4 text-primary mt-0.5" />
                        <span className="text-2xl font-bold text-primary tracking-tight">
                          {(p.price || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.is_active}
                        onCheckedChange={() => toggleActive(p)}
                        aria-label="Toggle active status"
                      />
                    </div>
                  </div>

                  {/* Duration & Active Members badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3 text-primary" />
                      {p.duration_days} days
                      {p.duration_unit && p.duration_unit !== "Days" && (
                        <span className="text-[10px] text-muted-foreground/80">
                          ({p.duration_value || 1} {p.duration_unit})
                        </span>
                      )}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                      <Users className="w-3 h-3 text-primary" />
                      {memberCount} active {memberCount === 1 ? "member" : "members"}
                    </span>
                  </div>

                  {/* Description if present */}
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-2.5 line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  {/* Benefits */}
                  {benefitsList.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-border/70">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Included Benefits
                      </p>
                      <ul className="space-y-1.5">
                        {benefitsList.slice(0, 4).map((b, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-foreground/85 flex items-start gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                            <span className="truncate">{b}</span>
                          </li>
                        ))}
                        {benefitsList.length > 4 && (
                          <li className="text-[11px] text-primary font-semibold pl-5">
                            +{benefitsList.length - 4} more benefits
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-2 pt-3.5 mt-4 border-t border-border/70">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openViewModal(p)}
                      className="h-8 rounded-xl px-2.5 text-xs text-foreground border-border hover:bg-muted"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(p)}
                      className="h-8 rounded-xl px-2.5 text-xs text-foreground border-border hover:bg-muted"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => promptDeletePlan(p)}
                    className="h-8 rounded-xl px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Membership Plan Modal Dialog */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto no-scrollbar p-0 rounded-3xl bg-white border border-border">
          <div className="sticky top-0 bg-white z-20 px-6 pt-5 pb-3 border-b border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">
                {isEditMode ? "Edit Membership Plan" : "Add Membership Plan"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure plan pricing, flexible durations, benefits and visibility.
            </p>
          </div>

          <form onSubmit={handleSavePlan} className="p-6 space-y-4">
            <div>
              <Label className="text-xs font-semibold">Plan Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Annual Elite, VIP All-Access"
                className="mt-1 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Price (₹) *</Label>
                <div className="relative mt-1">
                  <IndianRupee className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    placeholder="11999"
                    className="pl-9 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Active Status</Label>
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-border mt-1">
                  <span className="text-xs font-medium text-foreground">
                    {form.is_active ? "Enabled (Available for signups)" : "Disabled (Hidden)"}
                  </span>
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(val) => setForm({ ...form, is_active: val })}
                  />
                </div>
              </div>
            </div>

            {/* Duration and Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Duration Length *</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.duration_value}
                  onChange={(e) => setForm({ ...form, duration_value: e.target.value })}
                  required
                  placeholder="30"
                  className="mt-1 rounded-xl text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Duration Unit</Label>
                <Select
                  value={form.duration_unit}
                  onValueChange={(val) => setForm({ ...form, duration_unit: val })}
                >
                  <SelectTrigger className="mt-1 rounded-xl text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_UNITS.map((u) => (
                      <SelectItem key={u.unit} value={u.unit}>
                        {u.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80 text-xs text-muted-foreground font-mono flex items-center justify-between">
              <span>Calculated Membership Span:</span>
              <span className="font-bold text-foreground">
                {calculateDays(form.duration_value, form.duration_unit)} Days
              </span>
            </div>

            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief summary of who this plan is tailored for..."
                rows={2}
                className="mt-1 rounded-xl text-sm"
              />
            </div>

            {/* Dynamic Benefits Section */}
            <div>
              <Label className="text-xs font-semibold">Dynamic Benefits & Perks</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  placeholder="Add a perk (e.g. Free gym kit, VIP locker)"
                  className="rounded-xl text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddBenefit();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddBenefit}
                  className="bg-primary text-white rounded-xl px-4 text-xs font-semibold"
                >
                  Add Perk
                </Button>
              </div>

              {/* Benefits list chips */}
              <div className="mt-2.5 space-y-1.5">
                {form.benefitsList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-accent/40 border border-border text-xs text-foreground"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{item}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(idx)}
                      className="text-muted-foreground hover:text-red-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormModalOpen(false)}
                className="flex-1 rounded-xl h-11 border-border text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl h-11 bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                {saving
                  ? isEditMode
                    ? "Saving Changes..."
                    : "Creating Plan..."
                  : isEditMode
                  ? "Save Plan"
                  : "Create Plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Membership Plan Detail Modal */}
      {selectedPlan && (
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto no-scrollbar p-0 rounded-3xl bg-white border border-border">
            <div className="bg-gradient-to-br from-foreground to-foreground/90 text-white p-6 rounded-t-3xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold">{selectedPlan.name}</h3>
                    <Badge variant={selectedPlan.is_active ? "green" : "red"} className="text-[10px]">
                      {selectedPlan.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <IndianRupee className="w-5 h-5 text-primary" />
                    <span className="text-3xl font-extrabold text-primary">
                      {(selectedPlan.price || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(selectedPlan)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs h-8"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Edit Plan
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Stats overview */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/40 rounded-2xl border border-border text-xs">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold">Duration</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {selectedPlan.duration_days} Days
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold">Active Members</p>
                  <p className="text-sm font-bold text-primary mt-0.5">
                    {memberCountByPlan[selectedPlan.id] || 0} Members enrolled
                  </p>
                </div>
              </div>

              {selectedPlan.description && (
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground mb-1">
                    About this plan
                  </h4>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {selectedPlan.description}
                  </p>
                </div>
              )}

              {/* Benefits list */}
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground mb-2">
                  Included Benefits & Amenities
                </h4>
                <div className="space-y-2">
                  {(selectedPlan.benefits || "")
                    .split("\n")
                    .map((b) => b.trim())
                    .filter(Boolean)
                    .map((b, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-border text-xs text-foreground"
                      >
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => promptDeletePlan(selectedPlan)}
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold h-10"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete Plan
                </Button>
                <Button
                  onClick={() => toggleActive(selectedPlan)}
                  className="bg-primary text-white rounded-xl text-xs font-semibold h-10"
                >
                  {selectedPlan.is_active ? "Deactivate Plan" : "Activate Plan"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete / Deactivate Plan Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-3xl bg-white border border-border max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-foreground">
              {assignedMembersCount > 0
                ? "Plan Has Active Members"
                : "Delete Membership Plan?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {assignedMembersCount > 0 ? (
                <>
                  This plan is currently assigned to{" "}
                  <strong className="text-foreground">{assignedMembersCount} members</strong>.
                  Deleting this plan may affect existing memberships. We strongly recommend
                  deactivating this plan instead so existing members retain their plan history.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-foreground">{planToDelete?.name}</strong>? This action
                  cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:justify-end">
            <AlertDialogCancel
              disabled={deleting}
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-xl h-10 border-border text-xs font-semibold"
            >
              Cancel
            </AlertDialogCancel>

            {assignedMembersCount > 0 ? (
              <Button
                type="button"
                disabled={deleting}
                onClick={handleDeactivateInstead}
                className="rounded-xl h-10 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
              >
                {deleting ? "Deactivating..." : "Deactivate Instead"}
              </Button>
            ) : (
              <AlertDialogAction
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="rounded-xl h-10 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs"
              >
                {deleting ? "Deleting..." : "Delete Plan"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}