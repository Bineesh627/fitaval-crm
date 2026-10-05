import React, { useEffect, useState, useMemo } from "react";
import { client } from "@/api/client";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  Dumbbell,
  Clock,
  Trash2,
  Edit2,
  Eye,
  RefreshCw,
  AlertTriangle,
  User,
  Activity,
  Heart,
  FileText,
  CreditCard,
  History,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";
import { EmptyState, PageHeader, Badge } from "@/components/ui-shared";
import { format, addDays, parseISO, differenceInDays } from "date-fns";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  // Form submit state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Member form state
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

  // Recalculate end_date whenever plan_id or start_date changes in the form
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

  const openAddModal = () => {
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
    setFormModalOpen(true);
  };

  const openEditModal = (member) => {
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
    setFormModalOpen(true);
    if (viewModalOpen) {
      setViewModalOpen(false);
    }
  };

  const openViewModal = (member) => {
    setSelectedMember(member);
    setViewModalOpen(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
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
        if (selectedMember?.id === form.id) {
          setSelectedMember(updated);
        }
        toast({
          title: "Member updated successfully",
          description: `${updated.name}'s profile has been updated.`,
        });
      } else {
        const created = await client.entities.Member.create(memberPayload);
        setMembers((prev) => [created, ...prev]);
        toast({
          title: "Member added successfully",
          description: `${created.name} was enrolled in ${created.plan_name || "the gym"}.`,
        });
      }

      setFormModalOpen(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to save member",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const promptDeleteMember = (member) => {
    setMemberToDelete(member);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setDeleting(true);
    try {
      await client.entities.Member.delete(memberToDelete.id);
      setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
      if (selectedMember?.id === memberToDelete.id) {
        setViewModalOpen(false);
        setSelectedMember(null);
      }
      toast({
        title: "Member deleted successfully",
        description: `${memberToDelete.name} was permanently removed.`,
      });
      setDeleteConfirmOpen(false);
      setMemberToDelete(null);
    } catch (err) {
      console.error(err);
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleRenewMembership = async (member) => {
    try {
      const plan = plans.find((p) => p.id === member.plan_id) || plans[0];
      if (!plan) {
        toast({
          title: "No plan found",
          description: "Please assign a valid membership plan first.",
          variant: "destructive",
        });
        return;
      }

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
      if (selectedMember?.id === member.id) {
        setSelectedMember(updated);
      }

      toast({
        title: "Membership renewed",
        description: `${member.name} extended until ${format(newExpiry, "dd MMM yyyy")}.`,
      });
    } catch (err) {
      toast({
        title: "Renewal failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-9 h-9 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Loading Members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Members Management"
        subtitle={`${members.length} registered members`}
        action={
          <Button
            onClick={openAddModal}
            className="bg-primary text-primary-foreground gap-1.5 rounded-xl shadow-sm hover:bg-primary/90 h-10 px-4 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Add Member</span>
          </Button>
        }
      />

      {/* Dynamic Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email, plan..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                filter === f.key
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-white border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
              {f.key !== "all" && (
                <span className="ml-1 text-[10px] opacity-80">
                  ({members.filter((m) => m.status === f.key).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Member Cards List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search || filter !== "all" ? "No members match your criteria" : "No members yet"}
          description={
            search || filter !== "all"
              ? "Try adjusting your search terms or status filters."
              : "Add your first gym member to manage attendance, memberships and assigned trainers."
          }
          action={
            <Button onClick={openAddModal} className="bg-primary text-white rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" />
              Add First Member
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((m) => {
            const daysLeft = m.expiry_date
              ? differenceInDays(new Date(m.expiry_date), new Date())
              : null;

            return (
              <div
                key={m.id}
                className="rounded-2xl bg-white border border-border p-4.5 hover:shadow-xs transition-shadow flex flex-col justify-between gap-3"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                        {m.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => openViewModal(m)}
                          className="font-bold text-foreground text-sm hover:text-primary transition-colors truncate block text-left"
                        >
                          {m.name}
                        </button>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate font-medium">
                          {m.plan_name || "Monthly Basic"}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <Badge
                      variant={
                        m.status === "active"
                          ? "green"
                          : m.status === "expiring"
                          ? "amber"
                          : "red"
                      }
                      className="capitalize shrink-0 text-[11px]"
                    >
                      {m.status || "active"}
                    </Badge>
                  </div>

                  {/* Details summary */}
                  <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-border/70 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                      <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{m.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground truncate justify-end">
                      <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">
                        {m.expiry_date
                          ? `Expires: ${format(new Date(m.expiry_date), "dd MMM yyyy")}`
                          : "No expiry set"}
                      </span>
                    </div>
                  </div>

                  {/* Trainer or days badge */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/40">
                    <span className="truncate flex items-center gap-1">
                      <Dumbbell className="w-3 h-3 text-muted-foreground" />
                      {m.trainer_name ? `Trainer: ${m.trainer_name}` : "No trainer assigned"}
                    </span>
                    {daysLeft !== null && (
                      <span
                        className={`font-semibold shrink-0 ${
                          daysLeft < 0
                            ? "text-red-600"
                            : daysLeft <= 7
                            ? "text-amber-600 font-bold"
                            : "text-emerald-600"
                        }`}
                      >
                        {daysLeft < 0
                          ? `Expired ${Math.abs(daysLeft)}d ago`
                          : daysLeft === 0
                          ? "Expires today"
                          : `${daysLeft} days remaining`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/70">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openViewModal(m)}
                      className="h-8 rounded-xl px-2.5 text-xs text-foreground border-border hover:bg-muted"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(m)}
                      className="h-8 rounded-xl px-2.5 text-xs text-foreground border-border hover:bg-muted"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => promptDeleteMember(m)}
                      className="h-8 rounded-xl px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      title="Delete member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <button
                    onClick={() => handleRenewMembership(m)}
                    className="text-xs font-bold text-primary px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Renew
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Member Modal Dialog */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto no-scrollbar p-0 rounded-3xl bg-white border border-border">
          <div className="sticky top-0 bg-white z-20 px-6 pt-5 pb-3 border-b border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">
                {isEditMode ? "Edit Member" : "Add New Member"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEditMode
                ? "Update member profile details, membership dates and coach assignments."
                : "Fill out the registration details to enroll a new member into the CRM."}
            </p>
          </div>

          <form onSubmit={handleSaveMember} className="p-6 space-y-5">
            {/* 1. Personal Information */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 text-primary">
                <User className="w-3.5 h-3.5" />
                Personal Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Full Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="e.g. Karan Mehra"
                    className="mt-1 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Phone Number *</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                    placeholder="+91 98787 66554"
                    className="mt-1 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-xs font-semibold">Email Address</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="karan@example.com"
                    className="mt-1 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Gender</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(val) => setForm({ ...form, gender: val })}
                  >
                    <SelectTrigger className="mt-1 rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Date of Birth</Label>
                  <Input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                    className="mt-1 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Emergency Contact</Label>
                  <Input
                    value={form.emergency_contact}
                    onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                    placeholder="+91 98888 77665 (Father/Spouse)"
                    className="mt-1 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Residential Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Apartment, Street address, City"
                  className="mt-1 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* 2. Membership Information */}
            <div className="space-y-3.5 pt-4 border-t border-border">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 text-primary">
                <CreditCard className="w-3.5 h-3.5" />
                Membership Details & Expiry
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Select Membership Plan *</Label>
                  <Select
                    value={form.plan_id}
                    onValueChange={(val) => handlePlanOrDateChange(val, form.start_date)}
                  >
                    <SelectTrigger className="mt-1 rounded-xl text-sm">
                      <SelectValue placeholder="Choose a plan" />
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

                <div>
                  <Label className="text-xs font-semibold">Assigned Trainer</Label>
                  <Select
                    value={form.trainer_id}
                    onValueChange={(val) => setForm({ ...form, trainer_id: val })}
                  >
                    <SelectTrigger className="mt-1 rounded-xl text-sm">
                      <SelectValue placeholder="Assign a coach (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Trainer Assigned</SelectItem>
                      {trainers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.specialization})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Start Date</Label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => handlePlanOrDateChange(form.plan_id, e.target.value)}
                    className="mt-1 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">End Date (Auto-calculated)</Label>
                    <span className="text-[10px] text-primary font-medium">Auto-synced</span>
                  </div>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="mt-1 rounded-xl text-sm font-medium bg-muted/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Membership Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(val) => setForm({ ...form, status: val })}
                  >
                    <SelectTrigger className="mt-1 rounded-xl text-sm">
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
                    <SelectTrigger className="mt-1 rounded-xl text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid / Due</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 3. Additional Information */}
            <div className="space-y-3.5 pt-4 border-t border-border">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 text-primary">
                <Heart className="w-3.5 h-3.5" />
                Fitness Goals & Medical Notes
              </h4>

              <div>
                <Label className="text-xs font-semibold">Fitness Goals</Label>
                <Input
                  value={form.fitness_goals}
                  onChange={(e) => setForm({ ...form, fitness_goals: e.target.value })}
                  placeholder="e.g. Muscle hypertrophy, marathon preparation, weight loss"
                  className="mt-1 rounded-xl text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Medical / Injury Notes</Label>
                <Input
                  value={form.medical_notes}
                  onChange={(e) => setForm({ ...form, medical_notes: e.target.value })}
                  placeholder="e.g. Lower back stiffness, knee meniscus surgery, asthma"
                  className="mt-1 rounded-xl text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Internal Admin Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any operational notes for staff..."
                  rows={2}
                  className="mt-1 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Actions */}
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
                    : "Creating Member..."
                  : isEditMode
                  ? "Save Changes"
                  : "Create Member"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Member Profile Full Detail Modal */}
      {selectedMember && (
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto no-scrollbar p-0 rounded-3xl bg-white border border-border">
            {/* Header Hero */}
            <div className="bg-gradient-to-br from-foreground to-foreground/90 text-white p-6 rounded-t-3xl relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white/20">
                    {selectedMember.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedMember.name}</h3>
                    <p className="text-white/70 text-xs mt-0.5">
                      {selectedMember.plan_name || "Basic Membership"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          selectedMember.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : selectedMember.status === "expiring"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {selectedMember.status || "active"}
                      </span>
                      <span className="text-[11px] text-white/70">
                        Payment: {selectedMember.payment_status || "paid"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(selectedMember)}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs h-8"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>

            {/* Profile Content Body */}
            <div className="p-6 space-y-6">
              {/* Membership Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-muted/40 rounded-2xl border border-border">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold">Start Date</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {selectedMember.start_date
                      ? format(new Date(selectedMember.start_date), "dd MMM yyyy")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold">Expiry Date</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {selectedMember.expiry_date
                      ? format(new Date(selectedMember.expiry_date), "dd MMM yyyy")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold">Days Remaining</p>
                  <p className="text-xs font-bold text-primary mt-0.5">
                    {selectedMember.expiry_date
                      ? `${Math.max(0, differenceInDays(new Date(selectedMember.expiry_date), new Date()))} Days`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold">Assigned Trainer</p>
                  <p className="text-xs font-bold text-foreground mt-0.5 truncate">
                    {selectedMember.trainer_name || "None Assigned"}
                  </p>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                  Personal Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-border bg-white flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Phone</p>
                      <p className="font-semibold text-foreground">{selectedMember.phone}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-white flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Email</p>
                      <p className="font-semibold text-foreground">{selectedMember.email || "No email"}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-white flex items-center gap-2.5">
                    <User className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Gender & DOB</p>
                      <p className="font-semibold text-foreground">
                        {selectedMember.gender || "Not specified"}
                        {selectedMember.date_of_birth ? ` • Born ${selectedMember.date_of_birth}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-white flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Emergency Contact</p>
                      <p className="font-semibold text-foreground">
                        {selectedMember.emergency_contact || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fitness & Medical */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                  Goals & Medical Record
                </h4>
                <div className="p-4 rounded-2xl border border-border bg-white space-y-2.5 text-xs">
                  <div>
                    <span className="font-bold text-foreground">Fitness Goals: </span>
                    <span className="text-muted-foreground">
                      {selectedMember.fitness_goals || "General health and wellness maintenance."}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-foreground">Medical Notes: </span>
                    <span className="text-muted-foreground">
                      {selectedMember.medical_notes || "No pre-existing conditions recorded."}
                    </span>
                  </div>
                  {selectedMember.notes && (
                    <div>
                      <span className="font-bold text-foreground">Staff Notes: </span>
                      <span className="text-muted-foreground">{selectedMember.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity / Mock Attendance & History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Recent Activity & Check-ins</span>
                  <span className="text-[11px] text-primary font-normal">Last 3 visits</span>
                </h4>
                <div className="divide-y divide-border border border-border rounded-2xl bg-white overflow-hidden text-xs">
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Gym Floor Check-in (Main Turnstile)</span>
                    </div>
                    <span className="text-muted-foreground">Today, 06:42 AM</span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Gym Floor Check-in (Main Turnstile)</span>
                    </div>
                    <span className="text-muted-foreground">Yesterday, 06:35 AM</span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Personal Training Session</span>
                    </div>
                    <span className="text-muted-foreground">3 days ago, 07:00 AM</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => promptDeleteMember(selectedMember)}
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold h-10"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete Member
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleRenewMembership(selectedMember)}
                    className="bg-primary text-white rounded-xl text-xs font-semibold h-10 gap-1.5 hover:bg-primary/90"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Renew Membership
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-3xl bg-white border border-border max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-foreground">
              Delete Member?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{memberToDelete?.name}</strong>?
              This action cannot be undone and will remove all their membership records and history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={deleting}
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-xl h-10 border-border text-xs font-semibold"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={handleConfirmDelete}
              className="rounded-xl h-10 bg-red-600 text-white hover:bg-red-700 text-xs font-semibold shadow-xs"
            >
              {deleting ? "Deleting..." : "Delete Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}