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
  MoreVertical,
  X,
  Power,
  ArrowLeft,
} from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Badge,
  MobileBottomSheet,
  MobileFullFormPanel,
} from "@/components/ui-shared";
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

/**
 * Tactile Toggle Switch component matching visual reference:
 * - Green recessed track with green-ringed knob when ON (Active)
 * - Grey recessed track with grey-ringed knob when OFF (Inactive)
 * - Knob protrudes vertically above and below track with soft shadow
 */
export function PlanStatusRadioToggle({
  active = true,
  onChange,
  disabled = false,
  size = "sm",
}) {
  const isLarge = size === "md";

  const trackWidth = isLarge ? "w-[60px]" : "w-[52px]";
  const trackHeight = isLarge ? "h-[28px]" : "h-[24px]";
  const knobSize = isLarge ? "w-[36px] h-[36px]" : "w-[30px] h-[30px]";
  const knobBorder = isLarge ? "border-[3.5px]" : "border-[3px]";
  const knobTranslate = isLarge ? "translate-x-[28px]" : "translate-x-[24px]";

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!disabled && onChange) {
      onChange(!active);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && onChange) {
        onChange(!active);
      }
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={active ? "Plan active (ON)" : "Plan inactive (OFF)"}
      disabled={disabled}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      title={active ? "Active: Click to turn OFF" : "Inactive: Click to turn ON"}
      className={`relative inline-flex items-center shrink-0 cursor-pointer select-none p-0 bg-transparent border-0 outline-hidden focus-visible:ring-2 focus-visible:ring-primary/60 rounded-full transition-opacity touch-manipulation ${
        disabled ? "opacity-60 pointer-events-none cursor-not-allowed" : ""
      }`}
    >
      {/* Recessed Pill Track */}
      <span
        className={`block rounded-full transition-colors duration-200 ease-in-out ${trackWidth} ${trackHeight} ${
          active
            ? "bg-[#38b54a] dark:bg-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.32)]"
            : "bg-[#d8dcdf] dark:bg-slate-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
        }`}
      />

      {/* Tactile Circular Knob with colored ring matching image */}
      <span
        aria-hidden="true"
        className={`absolute left-[-2px] top-1/2 -translate-y-1/2 rounded-full bg-[#e3e6e8] dark:bg-slate-200 shadow-[0_2px_5px_rgba(0,0,0,0.25)] transition-all duration-200 ease-in-out ${knobSize} ${knobBorder} ${
          active
            ? `${knobTranslate} border-[#38b54a] dark:border-emerald-500`
            : "translate-x-0 border-[#9ba1a6] dark:border-slate-400"
        }`}
      />
    </button>
  );
}

export default function Plans() {
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'on' | 'off'

  // Mobile Bottom Action Sheet for "⋮"
  const [actionSheetPlan, setActionSheetPlan] = useState(null);

  // Full Screen Mobile Panels
  const [formPanelOpen, setFormPanelOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewPanelOpen, setViewPanelOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  const memberCountByPlan = useMemo(() => {
    const counts = {};
    members.forEach((m) => {
      if (m.plan_id) {
        counts[m.plan_id] = (counts[m.plan_id] || 0) + 1;
      }
    });
    return counts;
  }, [members]);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (filterStatus === "on") return p.is_active;
      if (filterStatus === "off") return !p.is_active;
      return true;
    });
  }, [plans, filterStatus]);

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

  const openAddForm = () => {
    setForm({
      ...initialForm,
      benefitsList: [
        "Unlimited gym floor access",
        "Locker and shower room use",
        "1 Free body assessment",
      ],
    });
    setBenefitInput("");
    setIsEditMode(false);
    setFormPanelOpen(true);
  };

  const openEditForm = (plan) => {
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
    setActionSheetPlan(null);
    setFormPanelOpen(true);
    if (viewPanelOpen) setViewPanelOpen(false);
  };

  const openViewProfile = (plan) => {
    setSelectedPlan(plan);
    setActionSheetPlan(null);
    setViewPanelOpen(true);
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
    if (e) e.preventDefault();
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
        if (selectedPlan?.id === form.id) setSelectedPlan(updated);
        toast({
          title: "Plan updated",
          description: `${updated.name} updated successfully.`,
        });
      } else {
        const created = await client.entities.MembershipPlan.create(payload);
        setPlans((prev) => [created, ...prev]);
        toast({
          title: "Plan created",
          description: `${created.name} is now available.`,
        });
      }

      setFormPanelOpen(false);
    } catch (err) {
      toast({ title: "Failed to save plan", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePlanStatusChange = async (plan, newStatus) => {
    if (Boolean(plan.is_active) === Boolean(newStatus)) return;
    try {
      const updated = await client.entities.MembershipPlan.update(plan.id, {
        is_active: newStatus,
      });
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? updated : p)));
      if (selectedPlan?.id === plan.id) setSelectedPlan(updated);
      toast({
        title: newStatus ? "Plan Toggled ON" : "Plan Toggled OFF",
        description: `${plan.name} is now ${newStatus ? "Active (ON)" : "Inactive (OFF)"}.`,
      });
    } catch (err) {
      toast({
        title: "Status update failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const toggleActive = (plan) => {
    handlePlanStatusChange(plan, !plan.is_active);
    setActionSheetPlan(null);
  };

  const promptDeletePlan = (plan) => {
    setPlanToDelete(plan);
    setActionSheetPlan(null);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    setDeleting(true);
    try {
      await client.entities.MembershipPlan.delete(planToDelete.id);
      setPlans((prev) => prev.filter((p) => p.id !== planToDelete.id));
      if (selectedPlan?.id === planToDelete.id) {
        setViewPanelOpen(false);
        setSelectedPlan(null);
      }
      toast({ title: "Plan deleted", description: `${planToDelete.name} was removed.` });
      setDeleteConfirmOpen(false);
      setPlanToDelete(null);
    } catch (err) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
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
      if (selectedPlan?.id === planToDelete.id) setSelectedPlan(updated);
      toast({
        title: "Plan deactivated",
        description: `${planToDelete.name} is now marked inactive.`,
      });
      setDeleteConfirmOpen(false);
      setPlanToDelete(null);
    } catch (err) {
      toast({ title: "Error deactivating", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
        <p className="text-xs text-muted-foreground font-medium">Loading Plans...</p>
      </div>
    );
  }

  const assignedMembersCount = planToDelete ? memberCountByPlan[planToDelete.id] || 0 : 0;

  return (
    <div className="space-y-3.5">
      {/* Mobile-First Header: ← Membership Plans     + */}
      <PageHeader
        title="Membership Plans"
        subtitle={`${plans.length} total plans`}
        action={
          <button
            type="button"
            onClick={openAddForm}
            className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-all active:scale-95 touch-manipulation"
            aria-label="Add Plan"
          >
            <Plus className="w-5 h-5" strokeWidth={2.6} />
          </button>
        }
      />

      {/* Quick Status Filter Tabs: [All] [● ON] [○ OFF] */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {[
          { key: "all", label: `All (${plans.length})` },
          { key: "on", label: `● ON (${plans.filter((p) => p.is_active).length})` },
          { key: "off", label: `○ OFF (${plans.filter((p) => !p.is_active).length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
              filterStatus === tab.key
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Full-Width Mobile Plan Cards Stack */}
      {filteredPlans.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={plans.length === 0 ? "No membership plans yet" : `No ${filterStatus.toUpperCase()} plans found`}
          description={
            plans.length === 0
              ? "Create membership tiers with custom pricing, durations, and included benefits."
              : `There are currently no plans in the ${filterStatus.toUpperCase()} status.`
          }
          action={
            plans.length === 0 ? (
              <Button onClick={openAddForm} className="bg-primary text-white rounded-xl h-11 px-5 text-xs font-bold">
                <Plus className="w-4 h-4 mr-1.5" />
                Create Plan
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setFilterStatus("all")}
                className="rounded-xl h-10 px-4 text-xs font-semibold"
              >
                Show All Plans
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredPlans.map((p) => {
            const memberCount = memberCountByPlan[p.id] || 0;
            const benefitsList = (p.benefits || "")
              .split("\n")
              .map((b) => b.trim())
              .filter(Boolean);

            return (
              <div
                key={p.id}
                className="w-full rounded-2xl bg-card border border-border p-4 shadow-xs flex flex-col gap-3 transition-all"
              >
                {/* 1. Top row: Name + Radio Toggle Left (OFF) / Right (ON) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        p.is_active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
                      }`}
                    />
                    <h3
                      onClick={() => openViewProfile(p)}
                      className="font-bold text-base text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                    >
                      {p.name}
                    </h3>
                  </div>

                  {/* Radio button toggle: Left (OFF) and Right (ON) */}
                  <PlanStatusRadioToggle
                    active={Boolean(p.is_active)}
                    onChange={(newVal) => handlePlanStatusChange(p, newVal)}
                  />
                </div>

                {/* 2. Price and Duration */}
                <div className="flex items-baseline justify-between pt-1 border-t border-border/60">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-black text-foreground">
                      ₹{(p.price || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      / {p.duration_days} days
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {memberCount} active {memberCount === 1 ? "member" : "members"}
                  </span>
                </div>

                {/* 3. Included Benefits List */}
                {benefitsList.length > 0 && (
                  <div className="space-y-1.5 pt-1 text-xs text-foreground/85">
                    {benefitsList.slice(0, 3).map((b, i) => (
                      <div key={i} className="flex items-start gap-1.5 truncate">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="truncate">{b}</span>
                      </div>
                    ))}
                    {benefitsList.length > 3 && (
                      <p className="text-[11px] text-primary font-bold pl-5">
                        +{benefitsList.length - 3} more benefits
                      </p>
                    )}
                  </div>
                )}

                {/* 4. Action Row: [View Plan] and "⋮" Menu */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openViewProfile(p)}
                    className="flex-1 rounded-xl h-10 border-border text-xs font-bold text-foreground hover:bg-muted"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-primary" />
                    View Plan
                  </Button>

                  <button
                    type="button"
                    onClick={() => setActionSheetPlan(p)}
                    className="w-10 h-10 rounded-xl hover:bg-muted border border-border flex items-center justify-center text-foreground transition-colors touch-manipulation shrink-0"
                    aria-label="Plan Actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plan Action Bottom Sheet */}
      <MobileBottomSheet
        open={Boolean(actionSheetPlan)}
        onClose={() => setActionSheetPlan(null)}
        title={actionSheetPlan?.name || "Plan Actions"}
      >
        <div className="space-y-1.5 pb-2">
          <button
            type="button"
            onClick={() => actionSheetPlan && openViewProfile(actionSheetPlan)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted text-left font-semibold text-xs sm:text-sm text-foreground transition-colors"
          >
            <Eye className="w-4 h-4 text-primary" />
            <span>View Plan Details</span>
          </button>
          <button
            type="button"
            onClick={() => actionSheetPlan && openEditForm(actionSheetPlan)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted text-left font-semibold text-xs sm:text-sm text-foreground transition-colors"
          >
            <Edit2 className="w-4 h-4 text-primary" />
            <span>Edit Plan</span>
          </button>
          <div className="pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => actionSheetPlan && promptDeletePlan(actionSheetPlan)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-red-50 text-left font-semibold text-xs sm:text-sm text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Delete Plan</span>
            </button>
          </div>
        </div>
      </MobileBottomSheet>

      {/* Full-Screen Add / Edit Plan Panel */}
      <MobileFullFormPanel
        open={formPanelOpen}
        onClose={() => setFormPanelOpen(false)}
        title={isEditMode ? "Edit Membership Plan" : "Add Membership Plan"}
        subtitle="Configure pricing, duration and member perks"
        submitLabel={isEditMode ? "Save Plan" : "Create Plan"}
        onSubmit={handleSavePlan}
        isSubmitting={saving}
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <div>
            <Label className="text-xs font-semibold">Plan Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Annual Elite"
              className="mt-1 rounded-xl h-11 text-xs sm:text-sm"
            />
          </div>

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
                className="pl-9 rounded-xl h-11 text-xs sm:text-sm font-semibold"
              />
            </div>
          </div>

          {/* Duration Value and Unit */}
          <div>
            <Label className="text-xs font-semibold">Duration Length *</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Input
                type="number"
                min="1"
                value={form.duration_value}
                onChange={(e) => setForm({ ...form, duration_value: e.target.value })}
                required
                placeholder="30"
                className="rounded-xl h-11 text-xs"
              />
              <Select
                value={form.duration_unit}
                onValueChange={(val) => setForm({ ...form, duration_unit: val })}
              >
                <SelectTrigger className="rounded-xl h-11 text-xs">
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
            <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
              Calculates to {calculateDays(form.duration_value, form.duration_unit)} total days.
            </p>
          </div>

          {/* Dynamic Benefits */}
          <div>
            <Label className="text-xs font-semibold">Benefits & Perks</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                placeholder="Add perk (e.g. Free gym kit)"
                className="rounded-xl h-11 text-xs"
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
                className="bg-primary text-white rounded-xl px-4 text-xs font-bold h-11"
              >
                Add
              </Button>
            </div>

            <div className="mt-2.5 space-y-1.5">
              {form.benefitsList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/60 border border-border text-xs text-foreground"
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

          <div>
            <Label className="text-xs font-semibold">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief overview..."
              rows={2}
              className="mt-1 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border">
            <div>
              <span className="text-xs font-bold text-foreground block">
                Plan Availability
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {form.is_active ? "Status: ON (Active)" : "Status: OFF (Inactive)"}
              </p>
            </div>
            <PlanStatusRadioToggle
              active={Boolean(form.is_active)}
              onChange={(val) => setForm((prev) => ({ ...prev, is_active: val }))}
              size="md"
            />
          </div>
        </form>
      </MobileFullFormPanel>

      {/* View Plan Details Full Screen Mobile View */}
      {selectedPlan && viewPanelOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background sm:items-center sm:justify-center animate-in fade-in duration-200">
          <div
            className="hidden sm:block fixed inset-0 bg-black/60"
            onClick={() => setViewPanelOpen(false)}
          />

          <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-xl bg-card sm:rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden">
            <div className="sticky top-0 bg-card/95 backdrop-blur-md px-4 py-3 border-b border-border flex items-center justify-between z-20">
              <button
                type="button"
                onClick={() => setViewPanelOpen(false)}
                className="w-10 h-10 -ml-1 rounded-xl hover:bg-muted flex items-center justify-center text-foreground touch-manipulation"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <p className="font-bold text-sm sm:text-base text-foreground truncate">
                {selectedPlan.name}
              </p>
              <button
                type="button"
                onClick={() => setActionSheetPlan(selectedPlan)}
                className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center text-foreground touch-manipulation"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-20">
              {/* Header card */}
              <div className="p-4 bg-muted/40 rounded-2xl border border-border flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-2xl text-foreground">
                    ₹{(selectedPlan.price || 0).toLocaleString("en-IN")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Valid for {selectedPlan.duration_days} days
                  </p>
                </div>
                <PlanStatusRadioToggle
                  active={Boolean(selectedPlan.is_active)}
                  onChange={(val) => handlePlanStatusChange(selectedPlan, val)}
                  size="md"
                />
              </div>

              {/* Enrolled members */}
              <div className="p-4 bg-card rounded-2xl border border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Enrolled Members:</span>
                <span className="font-bold text-primary text-sm">
                  {memberCountByPlan[selectedPlan.id] || 0} Members
                </span>
              </div>

              {/* Benefits */}
              <div className="p-4 bg-card rounded-2xl border border-border space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                  Included Benefits
                </p>
                <div className="space-y-1.5 text-xs text-foreground/85">
                  {(selectedPlan.benefits || "")
                    .split("\n")
                    .map((b) => b.trim())
                    .filter(Boolean)
                    .map((b, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-border bg-card flex gap-2 safe-bottom">
              <Button
                variant="outline"
                onClick={() => openEditForm(selectedPlan)}
                className="flex-1 rounded-xl h-11 text-xs font-bold border-border text-foreground hover:bg-muted"
              >
                Edit Plan
              </Button>
              <Button
                onClick={() => handlePlanStatusChange(selectedPlan, !selectedPlan.is_active)}
                className={`flex-1 rounded-xl h-11 text-xs font-bold text-white transition-colors ${
                  selectedPlan.is_active
                    ? "bg-slate-800 hover:bg-slate-900"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {selectedPlan.is_active ? "Toggle OFF" : "Toggle ON"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Deactivate Plan Alert Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-3xl bg-card border border-border max-w-sm">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-1">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              {assignedMembersCount > 0 ? "Plan Has Active Members" : "Delete Membership Plan?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {assignedMembersCount > 0 ? (
                <>
                  This plan is currently assigned to{" "}
                  <strong className="text-foreground">{assignedMembersCount} members</strong>. We
                  recommend deactivating it instead of deleting.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-foreground">{planToDelete?.name}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-3 gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="rounded-xl h-11 border-border text-xs font-semibold"
            >
              Cancel
            </AlertDialogCancel>
            {assignedMembersCount > 0 ? (
              <Button
                type="button"
                disabled={deleting}
                onClick={handleDeactivateInstead}
                className="rounded-xl h-11 bg-amber-600 text-white text-xs font-bold"
              >
                Deactivate Instead
              </Button>
            ) : (
              <AlertDialogAction
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="rounded-xl h-11 bg-red-600 text-white text-xs font-bold"
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