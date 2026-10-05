import React, { useEffect, useState } from "react";
import { client } from "@/api/client";
import { getImageUrl } from "@/utils/imageUrl";
import { Plus, Dumbbell, Award, Briefcase, Camera, X } from "lucide-react";
import { EmptyState, PageHeader, Sheet, Badge } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", photo_url: "", specialization: "", experience_years: "", certifications: "", bio: "" });

  useEffect(() => {
    (async () => {
      try {
        const t = await client.entities.Trainer.list("-created_date", 100);
        setTrainers(t);
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
      const created = await client.entities.Trainer.create({
        name: form.name,
        photo_url: form.photo_url,
        specialization: form.specialization,
        experience_years: form.experience_years ? parseInt(form.experience_years) : 0,
        certifications: form.certifications,
        bio: form.bio,
      });
      setTrainers((prev) => [created, ...prev]);
      setSheetOpen(false);
      setForm({ name: "", photo_url: "", specialization: "", experience_years: "", certifications: "", bio: "" });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to add trainer");
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await client.integrations.Core.UploadPublicFile({ file });
      setForm({ ...form, photo_url: file_url });
    } catch (err) {
      alert("Upload failed");
    }
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
        title="Trainers"
        subtitle={`${trainers.length} trainers`}
        action={
          <button onClick={() => setSheetOpen(true)} className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </button>
        }
      />

      {trainers.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No trainers yet"
          description="Add trainer profiles with specialization, experience and certifications"
          action={<Button onClick={() => setSheetOpen(true)} className="bg-primary"><Plus className="w-4 h-4 mr-1" />Add Trainer</Button>}
        />
      ) : (
        <div className="space-y-3">
          {trainers.map((t) => (
            <div key={t.id} className="rounded-2xl bg-white border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-lg font-bold overflow-hidden shrink-0">
                  {t.photo_url ? <img src={getImageUrl(t.photo_url)} alt={t.name} className="w-full h-full object-cover" /> : t.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground">{t.name}</h3>
                  <Badge variant="primary">{t.specialization}</Badge>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    {t.experience_years > 0 && (
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{t.experience_years} yrs exp</span>
                    )}
                    {t.certifications && (
                      <span className="flex items-center gap-1"><Award className="w-3 h-3" />{t.certifications}</span>
                    )}
                  </div>
                  {t.bio && <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{t.bio}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add Trainer">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
              {form.photo_url ? <img src={getImageUrl(form.photo_url)} alt="" className="w-full h-full object-cover" /> : <Camera className="w-7 h-7 text-muted-foreground" />}
            </div>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-medium">
                <Camera className="w-4 h-4" />Upload Photo
              </span>
            </label>
          </div>
          <div>
            <Label>Trainer Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1.5" placeholder="John Doe" />
          </div>
          <div>
            <Label>Specialization *</Label>
            <Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} required className="mt-1.5" placeholder="Strength Training" />
          </div>
          <div>
            <Label>Experience (years)</Label>
            <Input type="number" value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: e.target.value })} className="mt-1.5" placeholder="5" />
          </div>
          <div>
            <Label>Certifications</Label>
            <Input value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} className="mt-1.5" placeholder="ACE, NASM" />
          </div>
          <div>
            <Label>Short Bio</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1.5" placeholder="Tell members about the trainer..." rows={3} />
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-primary text-primary-foreground h-11">
            {saving ? "Saving..." : "Add Trainer"}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}