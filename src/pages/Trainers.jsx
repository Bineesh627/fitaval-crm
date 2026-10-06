import React, { useEffect, useState, useMemo } from "react";
import { client } from "@/api/client";
import { getImageUrl } from "@/utils/imageUrl";
import {
  Dumbbell,
  Plus,
  Search,
  Phone,
  Mail,
  Award,
  Briefcase,
  Camera,
  Trash2,
  Edit2,
  Eye,
  AlertTriangle,
  Users,
  MoreVertical,
  Calendar,
  Clock,
  Power,
  ArrowLeft,
  UserCheck,
} from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Badge,
  MobileBottomSheet,
  MobileFullFormPanel,
} from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import TrainerSchedulePicker from "@/components/TrainerSchedulePicker";

const SPECIALIZATION_OPTIONS = [
  "Strength Training",
  "Personal Training",
  "Yoga",
  "Mobility",
  "Weight Loss",
  "CrossFit",
  "Functional Training",
  "Rehabilitation",
  "Nutrition",
  "HIIT Conditioning",
];

export default function Trainers() {
  const { toast } = useToast();
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Mobile Bottom Action Sheet for "⋮"
  const [actionSheetTrainer, setActionSheetTrainer] = useState(null);

  // Full Screen Mobile Panels
  const [formPanelOpen, setFormPanelOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewPanelOpen, setViewPanelOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState(null);
  const [reassignTrainerId, setReassignTrainerId] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const initialForm = {
    id: null,
    name: "",
    photo_url: "",
    phone: "",
    email: "",
    specialization: "Strength Training",
    specializations: ["Strength Training"],
    experience_years: "5",
    certifications: "",
    bio: "",
    availability: "Available",
    working_days: "Monday – Friday",
    working_hours: "06:00 AM – 02:00 PM",
    status: "active",
  };
  const [form, setForm] = useState(initialForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [t, m] = await Promise.all([
        client.entities.Trainer.list("-created_date", 100),
        client.entities.Member.list("-created_date", 500),
      ]);
      setTrainers(t);
      setMembers(m);
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to load trainers",
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

  const membersByTrainer = useMemo(() => {
    const map = {};
    members.forEach((m) => {
      if (m.trainer_id) {
        if (!map[m.trainer_id]) map[m.trainer_id] = [];
        map[m.trainer_id].push(m);
      }
    });
    return map;
  }, [members]);

  const filteredTrainers = useMemo(() => {
    return trainers.filter((t) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        t.name?.toLowerCase().includes(q) ||
        t.specialization?.toLowerCase().includes(q) ||
        t.certifications?.toLowerCase().includes(q) ||
        t.phone?.includes(q)
      );
    });
  }, [trainers, search]);

  const openAddForm = () => {
    setForm(initialForm);
    setIsEditMode(false);
    setFormPanelOpen(true);
  };

  const openEditForm = (t) => {
    const specs = Array.isArray(t.specializations)
      ? t.specializations
      : t.specialization
      ? t.specialization.split(",").map((s) => s.trim())
      : ["Strength Training"];

    setForm({
      id: t.id,
      name: t.name || "",
      photo_url: t.photo_url || "",
      phone: t.phone || "",
      email: t.email || "",
      specialization: t.specialization || "Strength Training",
      specializations: specs,
      experience_years: t.experience_years?.toString() || "0",
      certifications: t.certifications || "",
      bio: t.bio || "",
      availability: t.availability || "Available",
      working_days: t.working_days || "Monday – Friday",
      working_hours: t.working_hours || "06:00 AM – 02:00 PM",
      status: t.status || "active",
    });
    setIsEditMode(true);
    setActionSheetTrainer(null);
    setFormPanelOpen(true);
    if (viewPanelOpen) setViewPanelOpen(false);
  };

  const openViewProfile = (t) => {
    setSelectedTrainer(t);
    setActionSheetTrainer(null);
    setViewPanelOpen(true);
  };

  const handleToggleSpecialization = (spec) => {
    let next;
    if (form.specializations.includes(spec)) {
      next = form.specializations.filter((s) => s !== spec);
      if (next.length === 0) next = [spec];
    } else {
      next = [...form.specializations, spec];
    }
    setForm({
      ...form,
      specializations: next,
      specialization: next.join(", "),
    });
  };

  const uploadTrainerPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await client.integrations.Core.UploadPublicFile({ file });
      setForm((prev) => ({ ...prev, photo_url: file_url }));
      toast({ title: "Photo selected", description: "Remember to save changes." });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSaveTrainer = async (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      toast({
        title: "Validation error",
        description: "Trainer name is required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        photo_url: form.photo_url,
        phone: form.phone.trim(),
        email: form.email.trim(),
        specialization: form.specializations.join(", "),
        specializations: form.specializations,
        experience_years: parseInt(form.experience_years, 10) || 0,
        certifications: form.certifications.trim(),
        bio: form.bio.trim(),
        availability: form.availability,
        working_days: form.working_days,
        working_hours: form.working_hours,
        status: form.status,
      };

      if (isEditMode && form.id) {
        const updated = await client.entities.Trainer.update(form.id, payload);
        setTrainers((prev) => prev.map((t) => (t.id === form.id ? updated : t)));
        if (selectedTrainer?.id === form.id) setSelectedTrainer(updated);
        toast({ title: "Trainer updated", description: `${updated.name}'s profile saved.` });
      } else {
        const created = await client.entities.Trainer.create(payload);
        setTrainers((prev) => [created, ...prev]);
        toast({ title: "Trainer added", description: `${created.name} added to roster.` });
      }
      setFormPanelOpen(false);
    } catch (err) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (trainer) => {
    try {
      const nextStatus = trainer.status === "inactive" ? "active" : "inactive";
      const updated = await client.entities.Trainer.update(trainer.id, {
        status: nextStatus,
      });
      setTrainers((prev) => prev.map((t) => (t.id === trainer.id ? updated : t)));
      if (selectedTrainer?.id === trainer.id) setSelectedTrainer(updated);
      setActionSheetTrainer(null);
      toast({
        title: nextStatus === "active" ? "Trainer enabled" : "Trainer disabled",
        description: `${trainer.name} is now ${nextStatus}.`,
      });
    } catch (err) {
      toast({ title: "Status update failed", description: err.message, variant: "destructive" });
    }
  };

  const promptDeleteTrainer = (trainer) => {
    setTrainerToDelete(trainer);
    const other = trainers.find((t) => t.id !== trainer.id);
    setReassignTrainerId(other?.id || "none");
    setActionSheetTrainer(null);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!trainerToDelete) return;
    setDeleting(true);
    try {
      await client.entities.Trainer.delete(trainerToDelete.id);
      setTrainers((prev) => prev.filter((t) => t.id !== trainerToDelete.id));
      if (selectedTrainer?.id === trainerToDelete.id) {
        setViewPanelOpen(false);
        setSelectedTrainer(null);
      }
      toast({ title: "Trainer deleted", description: `${trainerToDelete.name} was removed.` });
      setDeleteConfirmOpen(false);
      setTrainerToDelete(null);
    } catch (err) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleReassignAndProceed = async () => {
    if (!trainerToDelete) return;
    setDeleting(true);
    try {
      const targetTrainer = trainers.find((t) => t.id === reassignTrainerId);
      const assigned = membersByTrainer[trainerToDelete.id] || [];

      for (const m of assigned) {
        await client.entities.Member.update(m.id, {
          trainer_id: targetTrainer ? targetTrainer.id : null,
          trainer_name: targetTrainer ? targetTrainer.name : null,
        });
      }

      await client.entities.Trainer.delete(trainerToDelete.id);
      setTrainers((prev) => prev.filter((t) => t.id !== trainerToDelete.id));

      const updatedMembers = await client.entities.Member.list("-created_date", 500);
      setMembers(updatedMembers);

      if (selectedTrainer?.id === trainerToDelete.id) {
        setViewPanelOpen(false);
        setSelectedTrainer(null);
      }

      toast({
        title: "Members reassigned & trainer deleted",
        description: `${assigned.length} members were moved to ${
          targetTrainer ? targetTrainer.name : "unassigned"
        }.`,
      });
      setDeleteConfirmOpen(false);
      setTrainerToDelete(null);
    } catch (err) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
        <p className="text-xs text-muted-foreground font-medium">Loading Trainers...</p>
      </div>
    );
  }

  const assignedMembers = trainerToDelete ? membersByTrainer[trainerToDelete.id] || [] : [];

  return (
    <div className="space-y-3.5">
      {/* Mobile-First Header: ← Trainers     + */}
      <PageHeader
        title="Trainers"
        subtitle={`${trainers.length} registered coaches`}
        backTo="/settings"
        action={
          <button
            type="button"
            onClick={openAddForm}
            className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 transition-all active:scale-95 touch-manipulation"
            aria-label="Add Trainer"
          >
            <Plus className="w-5 h-5" strokeWidth={2.6} />
          </button>
        }
      />

      {/* Full Width Search Field */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search trainers, specializations..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card border border-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground text-foreground"
        />
      </div>

      {/* Stacked Mobile Trainer Cards */}
      {filteredTrainers.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={search ? "No coaches match search" : "No trainers yet"}
          description="Add personal trainers and group fitness coaches to assign members and track schedules."
          action={
            <Button onClick={openAddForm} className="bg-primary text-white rounded-xl h-11 px-5 text-xs font-bold">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Trainer
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredTrainers.map((t) => {
            const count = (membersByTrainer[t.id] || []).length;

            return (
              <div
                key={t.id}
                className="w-full rounded-2xl bg-card border border-border p-4 shadow-xs flex flex-col gap-3 transition-all"
              >
                {/* 1. Header with Photo + Name + Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 min-w-[48px] max-w-[48px] h-[48px] rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-base overflow-hidden shrink-0 shadow-xs border border-border/70 aspect-square">
                      {t.photo_url ? (
                        <img
                          src={getImageUrl(t.photo_url)}
                          alt={t.name}
                          className="w-full h-full object-cover shrink-0 block"
                        />
                      ) : (
                        t.name?.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3
                        onClick={() => openViewProfile(t)}
                        className="font-bold text-sm sm:text-base text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                      >
                        {t.name}
                      </h3>
                      <p className="text-xs text-primary font-semibold truncate mt-0.5">
                        {t.specialization}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t.experience_years} years exp • {count} assigned
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={t.status === "inactive" ? "red" : "green"}
                    className="capitalize shrink-0"
                  >
                    {t.status || "active"}
                  </Badge>
                </div>

                {/* 2. Certifications snippet */}
                {t.certifications && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1 border-t border-border/60 truncate">
                    <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">{t.certifications}</span>
                  </div>
                )}

                {/* 3. Action Row: [View Trainer] and "⋮" Menu Button */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openViewProfile(t)}
                    className="flex-1 rounded-xl h-10 border-border text-xs font-bold text-foreground hover:bg-muted"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-primary" />
                    View Trainer
                  </Button>

                  <button
                    type="button"
                    onClick={() => setActionSheetTrainer(t)}
                    className="w-10 h-10 rounded-xl hover:bg-muted border border-border flex items-center justify-center text-foreground transition-colors touch-manipulation shrink-0"
                    aria-label="Trainer Actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trainer Action Bottom Sheet */}
      <MobileBottomSheet
        open={Boolean(actionSheetTrainer)}
        onClose={() => setActionSheetTrainer(null)}
        title={actionSheetTrainer?.name || "Trainer Actions"}
      >
        <div className="space-y-1.5 pb-2">
          <button
            type="button"
            onClick={() => actionSheetTrainer && openViewProfile(actionSheetTrainer)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted text-left font-semibold text-xs sm:text-sm text-foreground transition-colors"
          >
            <Eye className="w-4 h-4 text-primary" />
            <span>View Trainer Profile</span>
          </button>
          <button
            type="button"
            onClick={() => actionSheetTrainer && openEditForm(actionSheetTrainer)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted text-left font-semibold text-xs sm:text-sm text-foreground transition-colors"
          >
            <Edit2 className="w-4 h-4 text-primary" />
            <span>Edit Profile</span>
          </button>
          <button
            type="button"
            onClick={() => actionSheetTrainer && toggleStatus(actionSheetTrainer)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted text-left font-semibold text-xs sm:text-sm text-foreground transition-colors"
          >
            <Power className="w-4 h-4 text-primary" />
            <span>
              {actionSheetTrainer?.status === "inactive" ? "Enable Trainer" : "Disable Trainer"}
            </span>
          </button>
          <div className="pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => actionSheetTrainer && promptDeleteTrainer(actionSheetTrainer)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-red-50 text-left font-semibold text-xs sm:text-sm text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Delete Trainer</span>
            </button>
          </div>
        </div>
      </MobileBottomSheet>

      {/* Full-Screen Add / Edit Trainer Panel */}
      <MobileFullFormPanel
        open={formPanelOpen}
        onClose={() => setFormPanelOpen(false)}
        title={isEditMode ? "Edit Trainer" : "Add Trainer"}
        subtitle="Manage professional background and coaching shifts"
        submitLabel={isEditMode ? "Save Changes" : "Add Trainer"}
        onSubmit={handleSaveTrainer}
        isSubmitting={saving}
      >
        <form onSubmit={handleSaveTrainer} className="space-y-4">
          {/* Photo upload */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center overflow-hidden shrink-0">
              {form.photo_url ? (
                <img
                  src={getImageUrl(form.photo_url)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <Label className="text-xs font-semibold">Coach Photo</Label>
              <label className="cursor-pointer block mt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadTrainerPhoto}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold">
                  <Camera className="w-3.5 h-3.5" />
                  Choose Photo
                </span>
              </label>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Full Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="Vikram Malhotra"
              className="mt-1 rounded-xl h-11 text-xs sm:text-sm"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Experience (Years)</Label>
            <Input
              type="number"
              value={form.experience_years}
              onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
              placeholder="5"
              className="mt-1 rounded-xl h-11 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Phone Number</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98555 66773"
              className="mt-1 rounded-xl h-11 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Email Address</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="vikram@fitaval.com"
              className="mt-1 rounded-xl h-11 text-xs"
            />
          </div>

          {/* Multi-Select Chips for Specializations */}
          <div>
            <Label className="text-xs font-semibold">Specializations (Tap to toggle)</Label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {SPECIALIZATION_OPTIONS.map((spec) => {
                const isSelected = form.specializations.includes(spec);
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => handleToggleSpecialization(spec)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {spec}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Certifications</Label>
            <Input
              value={form.certifications}
              onChange={(e) => setForm({ ...form, certifications: e.target.value })}
              placeholder="RYT 500, ACE CPT, CrossFit L2"
              className="mt-1 rounded-xl h-11 text-xs"
            />
          </div>

          {/* Working Days & Working Shift Interactive Scheduler (Gym Profile Operating Hours Style) */}
          <TrainerSchedulePicker
            workingDays={form.working_days}
            workingHours={form.working_hours}
            onChangeDays={(days) => setForm((prev) => ({ ...prev, working_days: days }))}
            onChangeHours={(hours) => setForm((prev) => ({ ...prev, working_hours: hours }))}
          />

          <div>
            <Label className="text-xs font-semibold">Coach Bio</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Postural correction and mobility specialist..."
              rows={3}
              className="mt-1 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl border border-border">
            <span className="text-xs font-semibold text-foreground">Active Status</span>
            <Switch
              checked={form.status === "active"}
              onCheckedChange={(val) => setForm({ ...form, status: val ? "active" : "inactive" })}
            />
          </div>
        </form>
      </MobileFullFormPanel>

      {/* View Trainer Profile Full Screen Mobile View */}
      {selectedTrainer && viewPanelOpen && (
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
                {selectedTrainer.name}
              </p>
              <button
                type="button"
                onClick={() => setActionSheetTrainer(selectedTrainer)}
                className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center text-foreground touch-manipulation"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-20">
              {/* Profile hero */}
              <div className="flex flex-col items-center text-center py-4 bg-muted/40 rounded-2xl border border-border">
                <div className="w-16 h-16 min-w-[64px] max-w-[64px] h-[64px] rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl overflow-hidden shadow-sm mb-2 border-2 border-white aspect-square shrink-0">
                  {selectedTrainer.photo_url ? (
                    <img
                      src={getImageUrl(selectedTrainer.photo_url)}
                      alt={selectedTrainer.name}
                      className="w-full h-full object-cover shrink-0 block"
                    />
                  ) : (
                    selectedTrainer.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <h3 className="font-bold text-lg text-foreground">{selectedTrainer.name}</h3>
                <p className="text-xs font-semibold text-primary mt-0.5">
                  {selectedTrainer.specialization}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTrainer.experience_years} years experience
                </p>
              </div>

              {/* Contact info */}
              <div className="rounded-2xl border border-border p-4 space-y-2 bg-card text-xs">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                  Contact Information
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-semibold text-foreground">{selectedTrainer.phone || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-semibold text-foreground">{selectedTrainer.email || "—"}</span>
                </div>
              </div>

              {/* Schedule */}
              <div className="rounded-2xl border border-border p-4 space-y-2 bg-card text-xs">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                  Working Schedule
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground">Days:</span>
                  <span className="font-semibold text-foreground">
                    {selectedTrainer.working_days || "Monday – Friday"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Hours:</span>
                  <span className="font-semibold text-foreground">
                    {selectedTrainer.working_hours || "06:00 AM – 02:00 PM"}
                  </span>
                </div>
              </div>

              {/* Assigned Members */}
              <div className="rounded-2xl border border-border p-4 space-y-2.5 bg-card">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">
                  Assigned Members ({(membersByTrainer[selectedTrainer.id] || []).length})
                </p>
                {(membersByTrainer[selectedTrainer.id] || []).length > 0 ? (
                  <div className="space-y-1.5 divide-y divide-border/60 text-xs">
                    {(membersByTrainer[selectedTrainer.id] || []).map((m) => (
                      <div key={m.id} className="pt-1.5 flex items-center justify-between">
                        <span className="font-semibold text-foreground">{m.name}</span>
                        <Badge variant={m.status === "active" ? "green" : "amber"}>
                          {m.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No members assigned to this coach.</p>
                )}
              </div>
            </div>

            <div className="p-3 border-t border-border bg-card flex gap-2 safe-bottom">
              <Button
                variant="outline"
                onClick={() => openEditForm(selectedTrainer)}
                className="flex-1 rounded-xl h-11 text-xs font-bold border-border text-foreground hover:bg-muted"
              >
                Edit Coach
              </Button>
              <Button
                onClick={() => toggleStatus(selectedTrainer)}
                className="flex-1 rounded-xl h-11 text-xs font-bold bg-primary text-white"
              >
                {selectedTrainer.status === "inactive" ? "Enable Coach" : "Disable Coach"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Dialog with Reassignment */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-3xl bg-card border border-border max-w-sm">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-1">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              {assignedMembers.length > 0 ? "Reassign Assigned Members" : "Delete Trainer?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {assignedMembers.length > 0 ? (
                <>
                  This trainer currently has{" "}
                  <strong className="text-foreground">{assignedMembers.length} members</strong>.
                  Please select where to reassign them before deletion.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-foreground">{trainerToDelete?.name}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {assignedMembers.length > 0 && (
            <div className="my-2 p-3 bg-muted/40 rounded-xl border border-border">
              <Label className="text-xs font-semibold">Reassign members to:</Label>
              <select
                value={reassignTrainerId}
                onChange={(e) => setReassignTrainerId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-border bg-card text-foreground font-medium mt-1"
              >
                <option value="none">Set to Unassigned</option>
                {trainers
                  .filter((t) => t.id !== trainerToDelete?.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialization})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <AlertDialogFooter className="mt-3 gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="rounded-xl h-11 border-border text-xs font-semibold"
            >
              Cancel
            </AlertDialogCancel>
            {assignedMembers.length > 0 ? (
              <Button
                type="button"
                disabled={deleting}
                onClick={handleReassignAndProceed}
                className="rounded-xl h-11 bg-amber-600 text-white text-xs font-bold"
              >
                Reassign & Delete
              </Button>
            ) : (
              <AlertDialogAction
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="rounded-xl h-11 bg-red-600 text-white text-xs font-bold"
              >
                {deleting ? "Deleting..." : "Delete Trainer"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}