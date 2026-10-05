import React, { useEffect, useState, useMemo } from "react";
import { client } from "@/api/client";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  Dumbbell,
  Trash2,
  Edit2,
  Eye,
  RefreshCw,
  AlertTriangle,
  User,
  Heart,
  CreditCard,
  CheckCircle2,
  MapPin,
  Clock,
  ArrowLeft,
} from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Badge,
  MobileBottomSheet,
  MobileFullFormPanel,
} from "@/components/ui-shared";
import { format, addDays, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "expiring", label: "Expiring" },
  { key: "inactive", label: "Inactive" },
];

export default function Members() {
  const { toast } = useToast();
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Mobile Action Bottom Sheet State for "⋮"
  const [actionSheetMember, setActionSheetMember] = useState(null);

  // Modals / Full Screen Panels
  const [formPanelOpen, setFormPanelOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewPanelOpen, setViewPanelOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Operation state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initialForm = {
    id: null,
    name: "",
    phone: "",
    email: "",
    date_of_birth: "",
    gender: "Male",
    address: "",
    emergency_contact: "",
    plan_id: "",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: "",
    status: "active",
    payment_status: "paid",
    fitness_goals: "",
    medical_notes: "",
    trainer_id: "",
    notes: "",
    source: "manual",
  };
  const [form, setForm] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [m, p, t] = await Promise.all([
        client.entities.Member.list("-created_date", 500),
        client.entities.MembershipPlan.list("-created_date", 100),
        client.entities.Trainer.list("-created_date", 100),
      ]);
      setMembers(m);
      setPlans(p);
      setTrainers(t);
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to load data",
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

  const handlePlanOrDateChange = (newPlanId, newStartDate) => {
    const plan = plans.find((p) => p.id === newPlanId);
    if (plan && newStartDate) {
      try {
        const start = new Date(newStartDate);
        const days = plan.duration_days || 30;
        const computedEnd = addDays(start, days);
        const formattedEnd = format(computedEnd, "yyyy-MM-dd");

        const today = new Date();
        const computedStatus =
          computedEnd < today
            ? "inactive"
            : addDays(computedEnd, -7) < today
            ? "expiring"
            : "active";

        setForm((prev) => ({
          ...prev,
          plan_id: newPlanId,
          start_date: newStartDate,
          end_date: formattedEnd,
          status: computedStatus,
        }));
        return;
      } catch {
        // ignore
      }
    }
    setForm((prev) => ({
      ...prev,
      plan_id: newPlanId,
      start_date: newStartDate,
    }));
  };

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        !search ||
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.phone?.includes(search) ||
        m.email?.toLowerCase().includes(search.toLowerCase()) ||
        m.plan_name?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || m.status === filter;
      return matchSearch && matchFilter;
    });
  }, [members, search, filter]);

  const openAddForm = () => {
    const defaultPlanId = plans[0]?.id || "";
    const startDate = format(new Date(), "yyyy-MM-dd");
    const plan = plans[0];
    const initialEnd = plan
      ? format(addDays(new Date(startDate), plan.duration_days || 30), "yyyy-MM-dd")
      : "";

    setForm({
      ...initialForm,
      plan_id: defaultPlanId,
      start_date: startDate,
      end_date: initialEnd,
    });
    setIsEditMode(false);
    setFormPanelOpen(true);
  };

  const openEditForm = (member) => {
    setForm({
      id: member.id,
      name: member.name || "",
      phone: member.phone || "",
      email: member.email || "",
      date_of_birth: member.date_of_birth || "",
      gender: member.gender || "Male",
      address: member.address || "",
      emergency_contact: member.emergency_contact || "",
      plan_id: member.plan_id || "",
      start_date: member.start_date || format(new Date(), "yyyy-MM-dd"),
      end_date: member.expiry_date || "",
      status: member.status || "active",
      payment_status: member.payment_status || "paid",
      fitness_goals: member.fitness_goals || "",
      medical_notes: member.medical_notes || "",
      trainer_id: member.trainer_id || "",
      notes: member.notes || "",
      source: member.source || "manual",
    });
    setIsEditMode(true);
    setActionSheetMember(null);
    setFormPanelOpen(true);
    if (viewPanelOpen) setViewPanelOpen(false);
  };

  const openViewProfile = (member) => {
    setSelectedMember(member);
    setActionSheetMember(null);
    setViewPanelOpen(true);
  };

  const handleSaveMember = async (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast({
        title: "Validation error",
        description: "Full name and phone number are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const selectedPlan = plans.find((p) => p.id === form.plan_id);
      const selectedTrainer = trainers.find((t) => t.id === form.trainer_id);

      const memberPayload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        address: form.address,
        emergency_contact: form.emergency_contact,
        plan_id: form.plan_id,
        plan_name: selectedPlan ? selectedPlan.name : form.plan_name || "Custom Plan",
        trainer_id: form.trainer_id || null,
        trainer_name: selectedTrainer ? selectedTrainer.name : null,
        start_date: form.start_date,
        expiry_date: form.end_date,
        status: form.status,
        payment_status: form.payment_status,
        fitness_goals: form.fitness_goals,
        medical_notes: form.medical_notes,
        notes: form.notes,
        source: form.source,
      };

      if (isEditMode && form.id) {
        const updated = await client.entities.Member.update(form.id, memberPayload);
        setMembers((prev) => prev.map((m) => (m.id === form.id ? updated : m)));
        if (selectedMember?.id === form.id) setSelectedMember(updated);
        toast({
          title: "Member updated",
          description: `${updated.name}'s profile was saved successfully.`,
        });
      } else {
        const created = await client.entities.Member.create(memberPayload);
        setMembers((prev) => [created, ...prev]);
        toast({
          title: "Member created",
          description: `${created.name} was successfully enrolled.`,
        });
      }

      setFormPanelOpen(false);
    } catch (err) {
      toast({
        title: "Failed to save",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const promptDeleteMember = (member) => {
    setMemberToDelete(member);
    setActionSheetMember(null);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setDeleting(true);
    try {
      await client.entities.Member.delete(memberToDelete.id);
      setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
      if (selectedMember?.id === memberToDelete.id) {
        setViewPanelOpen(false);
        setSelectedMember(null);
      }
      toast({
        title: "Member deleted",
        description: `${memberToDelete.name} was permanently removed.`,
      });
      setDeleteConfirmOpen(false);
      setMemberToDelete(null);
    } catch (err) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleRenewMembership = async (member) => {
    try {
      const plan = plans.find((p) => p.id === member.plan_id) || plans[0];
      if (!plan) return;

      const currentExpiry = member.expiry_date ? new Date(member.expiry_date) : new Date();
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      const newExpiry = addDays(baseDate, plan.duration_days || 30);
      const formatted = format(newExpiry, "yyyy-MM-dd");

      const updated = await client.entities.Member.update(member.id, {
        expiry_date: formatted,
        status: "active",
        payment_status: "paid",
      });

      setMembers((prev) => prev.map((m) => (m.id === member.id ? updated : m)));
      if (selectedMember?.id === member.id) setSelectedMember(updated);
      setActionSheetMember(null);

      toast({
        title: "Membership renewed",
        description: `${member.name} extended until ${format(newExpiry, "dd MMM yyyy")}.`,
      });
    } catch (err) {
      toast({ title: "Renewal failed", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
        <p className="text-xs text-muted-foreground font-medium">Loading Members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Mobile-First Header: ← Members   + */}
      <PageHeader
        title="Members"
        subtitle={`${members.length} total members`}
        action={
          <button
            type="button"
            onClick={openAddForm}
            className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-all active:scale-95 touch-manipulation"
            aria-label="Add Member"
          >
            <Plus className="w-5 h-5" strokeWidth={2.6} />
          </button>
        }
      />

      {/* Full-Width Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, email..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card border border-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground text-foreground"
        />
      </div>

      {/* Horizontally scrollable status filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
        {STATUS_FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? members.length
              : members.filter((m) => m.status === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 touch-manipulation ${
                filter === f.key
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
              <span className="ml-1 opacity-80 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Members List - Mobile Optimized Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search || filter !== "all" ? "No members match filter" : "No members yet"}
          description="Add your first member to start managing gym memberships, attendance, and coach assignments."
          action={
            <Button onClick={openAddForm} className="bg-primary text-white rounded-xl h-11 px-5 text-xs font-bold">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Member
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const daysLeft = m.expiry_date
              ? differenceInDays(new Date(m.expiry_date), new Date())
              : null;

            return (
              <div
                key={m.id}
                className="rounded-2xl bg-card border border-border p-4 shadow-xs flex flex-col gap-2.5 transition-all"
              >
                {/* 1. Top row: Status indicator + Name + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        m.status === "active"
                          ? "bg-emerald-500"
                          : m.status === "expiring"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                    />
                    <div className="min-w-0">
                      <p
                        onClick={() => openViewProfile(m)}
                        className="font-bold text-sm sm:text-base text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                      >
                        {m.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate font-medium">
                        {m.plan_name || "Monthly Basic"}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      m.status === "active"
                        ? "green"
                        : m.status === "expiring"
                        ? "amber"
                        : "red"
                    }
                    className="capitalize shrink-0"
                  >
                    {m.status || "active"}
                  </Badge>
                </div>

                {/* 2. Middle Row: Phone & Expiry Info (Stacked readable) */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-1.5 pt-1 text-xs text-muted-foreground border-t border-border/60">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{m.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      {m.expiry_date
                        ? `Expires ${format(new Date(m.expiry_date), "dd MMM yyyy")}`
                        : "No expiry date"}
                    </span>
                  </div>
                </div>

                {/* 3. Bottom Row: [View Member] primary action and "⋮" Menu Button */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openViewProfile(m)}
                    className="flex-1 rounded-xl h-10 border-border text-xs font-bold text-foreground hover:bg-muted"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-primary" />
                    View Member
                  </Button>

                  <button
                    type="button"
                    onClick={() => setActionSheetMember(m)}
                    className="w-10 h-10 rounded-xl hover:bg-muted border border-border flex items-center justify-center text-foreground transition-colors touch-manipulation shrink-0"
                    aria-label="Member Actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member Action Bottom Sheet (View, Edit, Renew, Delete) */}
      <MobileBottomSheet
        open={Boolean(actionSheetMember)}
        onClose={() => setActionSheetMember(null)}
        title={actionSheetMember?.name || "Member Actions"}
      >
        <div className="space-y-1.5 pb-2">
          <button
            type="button"
            onClick={() => actionSheetMember && openViewProfile(actionSheetMember)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted text-left font-semibold text-xs sm:text-sm text-foreground transition-colors"
          >
            <Eye className="w-4 h-4 text-primary" />
            <span>View Member Profile</span>
          </button>
          <button
            type="button"
            onClick={() => actionSheetMember && openEditForm(actionSheetMember)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted text-left font-semibold text-xs sm:text-sm text-foreground transition-colors"
          >
            <Edit2 className="w-4 h-4 text-primary" />
            <span>Edit Member Details</span>
          </button>
          <button
            type="button"
            onClick={() => actionSheetMember && handleRenewMembership(actionSheetMember)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted text-left font-semibold text-xs sm:text-sm text-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-primary" />
            <span>Renew Membership Plan</span>
          </button>
          <div className="pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => actionSheetMember && promptDeleteMember(actionSheetMember)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-red-50 text-left font-semibold text-xs sm:text-sm text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Delete Member</span>
            </button>
          </div>
        </div>
      </MobileBottomSheet>

      {/* Full-Screen Add / Edit Member Panel for Mobile & Desktop */}
      <MobileFullFormPanel
        open={formPanelOpen}
        onClose={() => setFormPanelOpen(false)}
        title={isEditMode ? "Edit Member" : "Add Member"}
        subtitle={isEditMode ? "Update personal info and plan" : "Enroll a new gym member"}
        submitLabel={isEditMode ? "Save Changes" : "Create Member"}
        onSubmit={handleSaveMember}
        isSubmitting={saving}
      >
        <form onSubmit={handleSaveMember} className="space-y-5">
          {/* Section: Personal Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-primary flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Personal Information
            </h4>

            <div>
              <Label className="text-xs font-semibold">Full Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Karan Mehra"
                className="mt-1 rounded-xl h-11 text-xs sm:text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Phone Number *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                placeholder="+91 98787 66554"
                className="mt-1 rounded-xl h-11 text-xs sm:text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Email Address</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="karan@example.com"
                className="mt-1 rounded-xl h-11 text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs font-semibold">Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(val) => setForm({ ...form, gender: val })}
                >
                  <SelectTrigger className="mt-1 rounded-xl h-11 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Date of Birth</Label>
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  className="mt-1 rounded-xl h-11 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Emergency Contact</Label>
              <Input
                value={form.emergency_contact}
                onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                placeholder="+91 98888 77665 (Father/Spouse)"
                className="mt-1 rounded-xl h-11 text-xs sm:text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Apartment, Street address, City"
                className="mt-1 rounded-xl h-11 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Section: Membership */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-primary flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Membership & Dates
            </h4>

            <div>
              <Label className="text-xs font-semibold">Membership Plan *</Label>
              <Select
                value={form.plan_id}
                onValueChange={(val) => handlePlanOrDateChange(val, form.start_date)}
              >
                <SelectTrigger className="mt-1 rounded-xl h-11 text-xs">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.duration_days}d) — ₹{(p.price || 0).toLocaleString("en-IN")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs font-semibold">Start Date</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => handlePlanOrDateChange(form.plan_id, e.target.value)}
                  className="mt-1 rounded-xl h-11 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">End Date</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="mt-1 rounded-xl h-11 text-xs bg-muted/40 font-medium"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Assigned Trainer</Label>
              <Select
                value={form.trainer_id}
                onValueChange={(val) => setForm({ ...form, trainer_id: val })}
              >
                <SelectTrigger className="mt-1 rounded-xl h-11 text-xs">
                  <SelectValue placeholder="Select Coach" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Coach</SelectItem>
                  {trainers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.specialization})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <Label className="text-xs font-semibold">Membership Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => setForm({ ...form, status: val })}
                >
                  <SelectTrigger className="mt-1 rounded-xl h-11 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expiring">Expiring</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Payment Status</Label>
                <Select
                  value={form.payment_status}
                  onValueChange={(val) => setForm({ ...form, payment_status: val })}
                >
                  <SelectTrigger className="mt-1 rounded-xl h-11 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Additional Notes */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" /> Goals & Medical Notes
            </h4>

            <div>
              <Label className="text-xs font-semibold">Fitness Goals</Label>
              <Input
                value={form.fitness_goals}
                onChange={(e) => setForm({ ...form, fitness_goals: e.target.value })}
                placeholder="Muscle building, marathon training"
                className="mt-1 rounded-xl h-11 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Medical / Injury Notes</Label>
              <Input
                value={form.medical_notes}
                onChange={(e) => setForm({ ...form, medical_notes: e.target.value })}
                placeholder="Lower back stiffness, knee surgery"
                className="mt-1 rounded-xl h-11 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Staff Internal Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Internal notes..."
                rows={2}
                className="mt-1 rounded-xl text-xs"
              />
            </div>
          </div>
        </form>
      </MobileFullFormPanel>

      {/* Member Details Full Screen Mobile View */}
      {selectedMember && viewPanelOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background sm:items-center sm:justify-center animate-in fade-in duration-200">
          <div
            className="hidden sm:block fixed inset-0 bg-black/60"
            onClick={() => setViewPanelOpen(false)}
          />

          <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-xl bg-card sm:rounded-3xl shadow-2xl z-10 flex flex-col overflow-hidden">
            {/* Header: ← Karan Mehra       ⋮ */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-md px-4 py-3 border-b border-border flex items-center justify-between z-20">
              <button
                type="button"
                onClick={() => setViewPanelOpen(false)}
                className="w-10 h-10 -ml-1 rounded-xl hover:bg-muted flex items-center justify-center text-foreground touch-manipulation"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <p className="font-bold text-sm sm:text-base text-foreground truncate">
                {selectedMember.name}
              </p>
              <button
                type="button"
                onClick={() => setActionSheetMember(selectedMember)}
                className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center text-foreground touch-manipulation"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body: Avatar + Vertically stacked cards */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-20">
              {/* Member Hero Badge */}
              <div className="flex flex-col items-center text-center py-4 bg-muted/40 rounded-2xl border border-border">
                <div className="w-18 h-18 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-sm mb-2">
                  {selectedMember.name?.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-lg text-foreground">{selectedMember.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedMember.status === "active"
                        ? "bg-emerald-500"
                        : selectedMember.status === "expiring"
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-xs font-semibold capitalize text-foreground">
                    {selectedMember.status || "active"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedMember.plan_name || "Monthly Basic"} •{" "}
                  {selectedMember.expiry_date
                    ? `Expires ${format(new Date(selectedMember.expiry_date), "dd MMM yyyy")}`
                    : "No expiry"}
                </p>
              </div>

              {/* 1. Contact Card */}
              <div className="rounded-2xl border border-border p-4 space-y-2.5 bg-card">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                  Contact
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-semibold text-foreground">{selectedMember.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-semibold text-foreground">{selectedMember.email || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-semibold text-foreground">{selectedMember.address || "—"}</span>
                  </div>
                </div>
              </div>

              {/* 2. Membership Card */}
              <div className="rounded-2xl border border-border p-4 space-y-2.5 bg-card">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                  Membership Details
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-semibold text-foreground">{selectedMember.plan_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Start Date:</span>
                    <span className="font-semibold text-foreground">
                      {selectedMember.start_date
                        ? format(new Date(selectedMember.start_date), "dd MMM yyyy")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Expiry Date:</span>
                    <span className="font-semibold text-foreground">
                      {selectedMember.expiry_date
                        ? format(new Date(selectedMember.expiry_date), "dd MMM yyyy")
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <span className="font-semibold text-primary capitalize">
                      {selectedMember.payment_status || "paid"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Trainer Card */}
              <div className="rounded-2xl border border-border p-4 space-y-2 bg-card">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                  Trainer
                </p>
                <p className="text-xs font-semibold text-foreground">
                  {selectedMember.trainer_name || "No trainer assigned"}
                </p>
              </div>

              {/* 4. Activity Card */}
              <div className="rounded-2xl border border-border p-4 space-y-2.5 bg-card">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                  Activity & Attendance
                </p>
                <div className="space-y-2 text-xs divide-y divide-border/60">
                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Gym Turnstile Check-in
                    </span>
                    <span className="text-muted-foreground">Today, 06:42 AM</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Gym Floor Check-in
                    </span>
                    <span className="text-muted-foreground">Yesterday, 06:30 AM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-border bg-card flex gap-2 safe-bottom">
              <Button
                variant="outline"
                onClick={() => openEditForm(selectedMember)}
                className="flex-1 rounded-xl h-11 text-xs font-bold border-border text-foreground hover:bg-muted"
              >
                Edit Member
              </Button>
              <Button
                onClick={() => handleRenewMembership(selectedMember)}
                className="flex-1 rounded-xl h-11 text-xs font-bold bg-primary text-white"
              >
                Renew Plan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-3xl bg-card border border-border max-w-sm">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-1">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Member?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{memberToDelete?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-3 gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="rounded-xl h-11 border-border text-xs font-semibold"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="rounded-xl h-11 bg-red-600 text-white text-xs font-bold"
            >
              {deleting ? "Deleting..." : "Delete Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}