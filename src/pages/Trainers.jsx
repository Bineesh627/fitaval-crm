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
  Clock,
  Calendar,
  Check,
  X,
  UserCheck,
} from "lucide-react";
import { EmptyState, PageHeader, Badge } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  "Bodybuilding",
];

export default function Trainers() {
  const { toast } = useToast();
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState(null);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignTrainerId, setReassignTrainerId] = useState("");

  // Actions
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form State
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

  // Compute members assigned to each trainer
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

  const openAddModal = () => {
    setForm(initialForm);
    setIsEditMode(false);
    setFormModalOpen(true);
  };

  const openEditModal = (t) => {
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
    setFormModalOpen(true);
    if (viewModalOpen) setViewModalOpen(false);
  };

  const openViewModal = (t) => {
    setSelectedTrainer(t);
    setViewModalOpen(true);
  };

  const handleToggleSpecialization = (spec) => {
    let next;
    if (form.specializations.includes(spec)) {
      next = form.specializations.filter((s) => s !== spec);
      if (next.length === 0) next = [spec]; // keep at least 1
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
    e.preventDefault();
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
        toast({
          title: "Trainer updated successfully",
          description: `${updated.name}'s profile has been updated.`,
        });
      } else {
        const created = await client.entities.Trainer.create(payload);
        setTrainers((prev) => [created, ...prev]);
        toast({
          title: "Trainer added successfully",
          description: `${created.name} was added to the fitness coach roster.`,
        });
      }
      setFormModalOpen(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "Save failed",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
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
      toast({
        title: nextStatus === "active" ? "Trainer activated" : "Trainer deactivated",
        description: `${trainer.name} is now ${nextStatus}.`,
      });
    } catch (err) {
      toast({ title: "Error changing status", description: err.message, variant: "destructive" });
    }
  };

  const promptDeleteTrainer = (trainer) => {
    setTrainerToDelete(trainer);
    const assigned = membersByTrainer[trainer.id] || [];
    if (assigned.length > 0) {
      // Find another available trainer to pre-fill reassign target
      const other = trainers.find((t) => t.id !== trainer.id);
      setReassignTrainerId(other?.id || "none");
    }
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!trainerToDelete) return;
    setDeleting(true);
    try {
      await client.entities.Trainer.delete(trainerToDelete.id);
      setTrainers((prev) => prev.filter((t) => t.id !== trainerToDelete.id));
      if (selectedTrainer?.id === trainerToDelete.id) {
        setViewModalOpen(false);
        setSelectedTrainer(null);
      }
      toast({
        title: "Trainer deleted",
        description: `${trainerToDelete.name} was removed from the roster.`,
      });
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

      // Update all assigned members
      for (const m of assigned) {
        await client.entities.Member.update(m.id, {
          trainer_id: targetTrainer ? targetTrainer.id : null,
          trainer_name: targetTrainer ? targetTrainer.name : null,
        });
      }

      // Now delete the trainer
      await client.entities.Trainer.delete(trainerToDelete.id);
      setTrainers((prev) => prev.filter((t) => t.id !== trainerToDelete.id));

      // Refresh members list
      const updatedMembers = await client.entities.Member.list("-created_date", 500);
      setMembers(updatedMembers);

      if (selectedTrainer?.id === trainerToDelete.id) {
        setViewModalOpen(false);
        setSelectedTrainer(null);
      }

      toast({
        title: "Members reassigned & trainer deleted",
        description: `${assigned.length} members were reassigned to ${
          targetTrainer ? targetTrainer.name : "unassigned"
        }.`,
      });
      setDeleteConfirmOpen(false);
      setTrainerToDelete(null);
    } catch (err) {
      toast({ title: "Reassign failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-9 h-9 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Loading Trainers...</p>
      </div>
    );
  }

  const assignedMembers = trainerToDelete ? membersByTrainer[trainerToDelete.id] || [] : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Trainers Management"
        subtitle={`${trainers.length} gym coaches & personal trainers`}
        action={
          <Button
            onClick={openAddModal}
            className="bg-primary text-primary-foreground gap-1.5 rounded-xl shadow-sm hover:bg-primary/90 h-10 px-4 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>Add Trainer</span>
          </Button>
        }
      />

      {/* Dynamic Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, specialization, certification..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
        />
      </div>

      {/* Trainer Cards */}
      {filteredTrainers.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={search ? "No trainers match your search" : "No trainers yet"}
          description={
            search
              ? "Try adjusting your search criteria."
              : "Add your first trainer to start managing coach profiles, certifications and member assignments."
          }
          action={
            <Button onClick={openAddModal} className="bg-primary text-white rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Trainer
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTrainers.map((t) => {
            const count = (membersByTrainer[t.id] || []).length;
            const specs = Array.isArray(t.specializations)
              ? t.specializations
              : t.specialization
              ? t.specialization.split(",").map((s) => s.trim())
              : [];

            return (
              <div
                key={t.id}
                className="rounded-2xl bg-white border border-border p-5 hover:shadow-xs transition-shadow flex flex-col justify-between gap-4"
              >
                <div>
                  {/* Top card banner */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-xl font-bold overflow-hidden shrink-0 shadow-xs border border-border">
                      {t.photo_url ? (
                        <img
                          src={getImageUrl(t.photo_url)}
                          alt={t.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        t.name?.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openViewModal(t)}
                          className="font-bold text-foreground text-base hover:text-primary transition-colors text-left truncate"
                        >
                          {t.name}
                        </button>
                        <Badge
                          variant={t.status === "inactive" ? "red" : "green"}
                          className="text-[10px] capitalize shrink-0"
                        >
                          {t.status || "active"}
                        </Badge>
                      </div>

                      <p className="text-xs font-semibold text-primary mt-0.5 truncate">
                        {t.specialization}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        {t.experience_years > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                            <Briefcase className="w-3 h-3 text-muted-foreground" />
                            {t.experience_years} yrs exp
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                          <Users className="w-3 h-3 text-primary" />
                          {count} {count === 1 ? "member" : "members"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Certifications & Bio */}
                  {t.certifications && (
                    <div className="mt-3 pt-3 border-t border-border/70 flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Award className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <span className="truncate">{t.certifications}</span>
                    </div>
                  )}

                  {t.bio && (
                    <p className="text-xs text-foreground/75 mt-2 line-clamp-2 leading-relaxed">
                      {t.bio}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/70">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openViewModal(t)}
                      className="h-8 rounded-xl px-2.5 text-xs text-foreground border-border hover:bg-muted"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(t)}
                      className="h-8 rounded-xl px-2.5 text-xs text-foreground border-border hover:bg-muted"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(t)}
                      className="h-8 rounded-xl px-2.5 text-[11px] font-medium border-border"
                    >
                      {t.status === "inactive" ? "Enable" : "Disable"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => promptDeleteTrainer(t)}
                      className="h-8 rounded-xl px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      title="Delete trainer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Trainer Modal Dialog */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto no-scrollbar p-0 rounded-3xl bg-white border border-border">
          <div className="sticky top-0 bg-white z-20 px-6 pt-5 pb-3 border-b border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">
                {isEditMode ? "Edit Trainer Profile" : "Add New Trainer"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter professional background, certifications, availability and specializations.
            </p>
          </div>

          <form onSubmit={handleSaveTrainer} className="p-6 space-y-4">
            {/* Photo Uploader */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center gap-4">
              <div className="w-18 h-18 rounded-2xl bg-white border-2 border-border flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {form.photo_url ? (
                  <img
                    src={getImageUrl(form.photo_url)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-7 h-7 text-muted-foreground" />
                )}
              </div>
              <div>
                <Label className="text-xs font-semibold">Profile Photo</Label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Square portrait image recommended
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadTrainerPhoto}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-xs hover:bg-primary/90">
                    <Camera className="w-3.5 h-3.5" />
                    Upload Photo
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Trainer Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. Vikram Malhotra"
                  className="mt-1 rounded-xl text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Experience (Years)</Label>
                <Input
                  type="number"
                  value={form.experience_years}
                  onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
                  placeholder="7"
                  className="mt-1 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Phone Number</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98555 66773"
                  className="mt-1 rounded-xl text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="trainer@fitaval.com"
                  className="mt-1 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Multiple Specializations Selection */}
            <div>
              <Label className="text-xs font-semibold">Specializations (Select all that apply)</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SPECIALIZATION_OPTIONS.map((spec) => {
                  const isSelected = form.specializations.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleToggleSpecialization(spec)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                          : "bg-white text-muted-foreground border-border hover:bg-muted"
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
              <Label className="text-xs font-semibold">Certifications & Credentials</Label>
              <Input
                value={form.certifications}
                onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                placeholder="RYT 500 Yoga Alliance, FMS Functional Movement Screen, ACE CPT"
                className="mt-1 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Working Days</Label>
                <Input
                  value={form.working_days}
                  onChange={(e) => setForm({ ...form, working_days: e.target.value })}
                  placeholder="Monday – Friday"
                  className="mt-1 rounded-xl text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Working Hours Shift</Label>
                <Input
                  value={form.working_hours}
                  onChange={(e) => setForm({ ...form, working_hours: e.target.value })}
                  placeholder="06:00 AM – 02:00 PM"
                  className="mt-1 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Short Bio & Coaching Philosophy</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Specialist in postural correction, mobility enhancement, and injury rehabilitation..."
                rows={3}
                className="mt-1 rounded-xl text-sm"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border">
              <span className="text-xs font-semibold text-foreground">
                Active on Trainer Roster
              </span>
              <Switch
                checked={form.status === "active"}
                onCheckedChange={(val) => setForm({ ...form, status: val ? "active" : "inactive" })}
              />
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
                    : "Adding Trainer..."
                  : isEditMode
                  ? "Save Changes"
                  : "Add Trainer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Trainer Detailed Profile Modal */}
      {selectedTrainer && (
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto no-scrollbar p-0 rounded-3xl bg-white border border-border">
            <div className="bg-gradient-to-br from-foreground to-foreground/90 text-white p-6 rounded-t-3xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-18 h-18 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-2xl overflow-hidden shadow-md border-2 border-white/20 shrink-0">
                    {selectedTrainer.photo_url ? (
                      <img
                        src={getImageUrl(selectedTrainer.photo_url)}
                        alt={selectedTrainer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedTrainer.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedTrainer.name}</h3>
                    <p className="text-primary text-xs font-semibold mt-0.5">
                      {selectedTrainer.specialization}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={selectedTrainer.status === "inactive" ? "red" : "green"}
                        className="text-[10px] capitalize"
                      >
                        {selectedTrainer.status || "active"}
                      </Badge>
                      <span className="text-[11px] text-white/70">
                        {selectedTrainer.experience_years} Years Experience
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(selectedTrainer)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs h-8"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Edit
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Contact info cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-border bg-white flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Phone</p>
                    <p className="font-semibold text-foreground">
                      {selectedTrainer.phone || "No phone provided"}
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-border bg-white flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Email</p>
                    <p className="font-semibold text-foreground">
                      {selectedTrainer.email || "No email provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule and availability */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                  Schedule & Shift Availability
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    Working Days:
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedTrainer.working_days || "Monday – Friday"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Working Hours:
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedTrainer.working_hours || "06:00 AM – 02:00 PM"}
                  </span>
                </div>
              </div>

              {/* Certifications and bio */}
              {selectedTrainer.certifications && (
                <div>
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    Certifications & Credentials
                  </h4>
                  <p className="text-xs text-foreground/85 p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                    {selectedTrainer.certifications}
                  </p>
                </div>
              )}

              {selectedTrainer.bio && (
                <div>
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Coach Bio
                  </h4>
                  <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
                    {selectedTrainer.bio}
                  </p>
                </div>
              )}

              {/* Assigned Members Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                    Assigned Members ({(membersByTrainer[selectedTrainer.id] || []).length})
                  </h4>
                </div>

                {(membersByTrainer[selectedTrainer.id] || []).length > 0 ? (
                  <div className="divide-y divide-border border border-border rounded-2xl bg-white overflow-hidden max-h-48 overflow-y-auto no-scrollbar">
                    {(membersByTrainer[selectedTrainer.id] || []).map((m) => (
                      <div key={m.id} className="p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                            {m.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground">{m.plan_name}</p>
                          </div>
                        </div>
                        <Badge
                          variant={m.status === "active" ? "green" : "amber"}
                          className="text-[10px]"
                        >
                          {m.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-border rounded-2xl">
                    <UserCheck className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">
                      No members currently assigned to this coach.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => promptDeleteTrainer(selectedTrainer)}
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold h-10"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete Trainer
                </Button>
                <Button
                  onClick={() => toggleStatus(selectedTrainer)}
                  className="bg-primary text-white rounded-xl text-xs font-semibold h-10"
                >
                  {selectedTrainer.status === "inactive" ? "Activate Coach" : "Deactivate Coach"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Alert Dialog with Reassignment Support */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-3xl bg-white border border-border max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-foreground">
              {assignedMembers.length > 0
                ? "Reassign Members Before Deletion"
                : "Delete Trainer?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {assignedMembers.length > 0 ? (
                <>
                  This trainer currently has{" "}
                  <strong className="text-foreground">{assignedMembers.length} assigned members</strong>.
                  Please select another coach to reassign these members before deleting this trainer, or
                  set them to unassigned.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-foreground">{trainerToDelete?.name}</strong>? This action
                  cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {assignedMembers.length > 0 && (
            <div className="my-3 p-3 bg-muted/40 rounded-2xl border border-border space-y-2">
              <Label className="text-xs font-semibold">Reassign members to:</Label>
              <select
                value={reassignTrainerId}
                onChange={(e) => setReassignTrainerId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-border bg-white font-medium"
              >
                <option value="none">Set to Unassigned (No Coach)</option>
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

          <AlertDialogFooter className="mt-4 gap-2 sm:justify-end">
            <AlertDialogCancel
              disabled={deleting}
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-xl h-10 border-border text-xs font-semibold"
            >
              Cancel
            </AlertDialogCancel>

            {assignedMembers.length > 0 ? (
              <Button
                type="button"
                disabled={deleting}
                onClick={handleReassignAndProceed}
                className="rounded-xl h-10 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
              >
                {deleting ? "Reassigning & Deleting..." : "Reassign Members & Delete"}
              </Button>
            ) : (
              <AlertDialogAction
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="rounded-xl h-10 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs"
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