import React, { useEffect, useState } from "react";
import { client } from "@/api/client";
import { getImageUrl } from "@/utils/imageUrl";
import { Building2, MapPin, Phone, Mail, Clock, Check, Plus, Camera, X } from "lucide-react";
import { EmptyState, PageHeader, Badge } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const AMENITY_OPTIONS = ["Parking", "Showers", "Lockers", "AC", "WiFi", "Personal Training", "Group Classes", "Sauna", "Cafeteria", "24/7 Access"];

export default function GymProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amenityInput, setAmenityInput] = useState("");

  const [form, setForm] = useState({
    name: "", logo_url: "", address: "", city: "", phone: "", email: "",
    operating_hours: "", description: "", amenities: [], gallery: [],
  });

  useEffect(() => {
    (async () => {
      try {
        const list = await client.entities.GymProfile.list("-created_date", 10);
        if (list.length > 0) {
          setProfile(list[0]);
          setForm({
            name: list[0].name || "",
            logo_url: list[0].logo_url || "",
            address: list[0].address || "",
            city: list[0].city || "",
            phone: list[0].phone || "",
            email: list[0].email || "",
            operating_hours: list[0].operating_hours || "",
            description: list[0].description || "",
            amenities: list[0].amenities || [],
            gallery: list[0].gallery || [],
          });
        } else {
          setEditing(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (profile) {
        const updated = await client.entities.GymProfile.update(profile.id, form);
        setProfile(updated);
      } else {
        const created = await client.entities.GymProfile.create(form);
        setProfile(created);
      }
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const addAmenity = (a) => {
    if (a && !form.amenities.includes(a)) {
      setForm({ ...form, amenities: [...form.amenities, a] });
    }
    setAmenityInput("");
  };

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await client.integrations.Core.UploadPublicFile({ file });
      setForm({ ...form, logo_url: file_url });
    } catch (err) {
      alert("Upload failed");
    }
  };

  const uploadGalleryImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await client.integrations.Core.UploadPublicFile({ file });
      setForm({ ...form, gallery: [...form.gallery, file_url] });
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

  if (!editing && profile) {
    return (
      <div>
        <PageHeader
          title="Gym Profile"
          action={<Button onClick={() => setEditing(true)} className="bg-primary text-primary-foreground">Edit</Button>}
        />

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-foreground to-foreground/80 text-white p-5 mb-4 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden">
              {form.logo_url ? (
                <img src={getImageUrl(form.logo_url)} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold truncate">{profile.name}</h2>
                {profile.is_verified && <Badge variant="green"><Check className="w-3 h-3 mr-0.5" />Verified</Badge>}
              </div>
              <p className="text-white/60 text-sm">{profile.city || "Location not set"}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-2xl bg-white border border-border p-5 mb-4 space-y-3">
          {profile.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">Address</p><p className="text-sm text-foreground">{profile.address}</p></div>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm text-foreground">{profile.phone}</p></div>
            </div>
          )}
          {profile.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm text-foreground">{profile.email}</p></div>
            </div>
          )}
          {profile.operating_hours && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">Operating Hours</p><p className="text-sm text-foreground">{profile.operating_hours}</p></div>
            </div>
          )}
        </div>

        {profile.description && (
          <div className="rounded-2xl bg-white border border-border p-5 mb-4">
            <p className="text-xs text-muted-foreground mb-1">About</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{profile.description}</p>
          </div>
        )}

        {profile.amenities?.length > 0 && (
          <div className="rounded-2xl bg-white border border-border p-5 mb-4">
            <p className="text-xs text-muted-foreground mb-2">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {profile.amenities.map((a) => (
                <Badge key={a} variant="primary"><Check className="w-3 h-3 mr-0.5" />{a}</Badge>
              ))}
            </div>
          </div>
        )}

        {profile.gallery?.length > 0 && (
          <div className="rounded-2xl bg-white border border-border p-5">
            <p className="text-xs text-muted-foreground mb-3">Photo Gallery</p>
            <div className="grid grid-cols-3 gap-2">
              {profile.gallery.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted">
                  <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={profile ? "Edit Gym Profile" : "Setup Gym Profile"} />

      <form onSubmit={handleSave} className="space-y-4">
        {/* Logo upload */}
        <div className="rounded-2xl bg-white border border-border p-5">
          <Label>Gym Logo</Label>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-20 h-20 rounded-2xl bg-muted border-2 border-border flex items-center justify-center overflow-hidden">
              {form.logo_url ? <img src={getImageUrl(form.logo_url)} alt="logo" className="w-full h-full object-cover" /> : <Camera className="w-7 h-7 text-muted-foreground" />}
            </div>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-medium">
                <Camera className="w-4 h-4" />Upload
              </span>
            </label>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-border p-5 space-y-4">
          <div>
            <Label>Gym Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1.5" placeholder="Fitaval Fitness Hub" />
          </div>
          <div>
            <Label>Address</Label>
            <Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1.5" placeholder="Street address" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1.5" placeholder="Mumbai" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" placeholder="+91..." />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" placeholder="gym@email.com" />
          </div>
          <div>
            <Label>Operating Hours</Label>
            <Input value={form.operating_hours} onChange={(e) => setForm({ ...form, operating_hours: e.target.value })} className="mt-1.5" placeholder="6 AM - 10 PM" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" placeholder="Tell members about your gym..." rows={3} />
          </div>
        </div>

        {/* Amenities */}
        <div className="rounded-2xl bg-white border border-border p-5">
          <Label>Amenities</Label>
          <div className="flex gap-2 mt-2">
            <Input value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)} placeholder="Add amenity" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity(amenityInput))} />
            <button type="button" onClick={() => addAmenity(amenityInput)} className="px-4 rounded-xl bg-primary text-primary-foreground">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {AMENITY_OPTIONS.map((a) => (
              <button key={a} type="button" onClick={() => addAmenity(a)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${form.amenities.includes(a) ? "bg-primary text-primary-foreground border-primary" : "bg-white text-muted-foreground border-border"}`}>
                {a}
              </button>
            ))}
          </div>
          {form.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
              {form.amenities.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                  {a}
                  <button type="button" onClick={() => setForm({ ...form, amenities: form.amenities.filter((x) => x !== a) })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Gallery */}
        <div className="rounded-2xl bg-white border border-border p-5">
          <Label>Photo Gallery</Label>
          <label className="mt-2 block">
            <input type="file" accept="image/*" onChange={uploadGalleryImage} className="hidden" />
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Tap to upload gym photos</p>
            </div>
          </label>
          {form.gallery.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {form.gallery.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                  <img src={getImageUrl(url)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setForm({ ...form, gallery: form.gallery.filter((_, idx) => idx !== i) })} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {profile && (
            <Button type="button" onClick={() => setEditing(false)} variant="outline" className="flex-1 h-11">Cancel</Button>
          )}
          <Button type="submit" disabled={saving} className="flex-1 bg-primary text-primary-foreground h-11">
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}