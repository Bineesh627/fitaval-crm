import React, { useEffect, useState } from "react";
import { client } from "@/api/client";
import { getImageUrl, ASSETS } from "@/utils/imageUrl";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Check,
  Plus,
  Camera,
  X,
  Navigation,
  ExternalLink,
  Edit2,
  Sliders,
  Compass,
} from "lucide-react";
import { EmptyState, PageHeader, Badge } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import OperatingHoursManager, {
  DEFAULT_WEEK_SCHEDULE,
  formatWeeklyScheduleSummary,
} from "@/components/OperatingHoursManager";
import GymLocationPicker from "@/components/GymLocationPicker";

const COMMON_AMENITIES = [
  "Parking",
  "Showers",
  "Lockers",
  "AC",
  "WiFi",
  "Personal Training",
  "Group Classes",
  "Sauna",
  "Steam Room",
  "Cafeteria",
  "24/7 Access",
  "Cardio Cinema",
  "Juice Bar",
  "Olympic Lifting Platforms",
];

export default function GymProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic"); // 'basic' | 'hours' | 'location' | 'amenities' | 'gallery'
  const [amenityInput, setAmenityInput] = useState("");

  const [form, setForm] = useState({
    name: "",
    logo_url: "",
    address: "",
    city: "",
    latitude: 28.4815,
    longitude: 77.0818,
    phone: "",
    email: "",
    operating_hours: "",
    weekly_schedule: DEFAULT_WEEK_SCHEDULE,
    description: "",
    amenities: [],
    gallery: [],
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const list = await client.entities.GymProfile.list("-created_date", 10);
      if (list.length > 0) {
        const item = list[0];
        setProfile(item);
        setForm({
          name: item.name || "",
          logo_url: item.logo_url || "",
          address: item.address || "",
          city: item.city || "",
          latitude: item.latitude || 28.4815,
          longitude: item.longitude || 77.0818,
          phone: item.phone || "",
          email: item.email || "",
          operating_hours: item.operating_hours || "",
          weekly_schedule: item.weekly_schedule || DEFAULT_WEEK_SCHEDULE,
          description: item.description || "",
          amenities: item.amenities || [],
          gallery: item.gallery || [],
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Error loading profile",
        description: e.message || "Failed to load gym profile data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        operating_hours: formatWeeklyScheduleSummary(form.weekly_schedule),
      };

      let saved;
      if (profile?.id) {
        saved = await client.entities.GymProfile.update(profile.id, payload);
      } else {
        saved = await client.entities.GymProfile.create(payload);
      }
      setProfile(saved);
      setForm((prev) => ({ ...prev, ...saved }));
      setEditModalOpen(false);
      setHoursModalOpen(false);
      setLocationModalOpen(false);

      toast({
        title: "Gym profile updated",
        description: "All changes have been successfully saved.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to update profile",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAmenity = (item) => {
    if (form.amenities.includes(item)) {
      setForm({ ...form, amenities: form.amenities.filter((a) => a !== item) });
    } else {
      setForm({ ...form, amenities: [...form.amenities, item] });
    }
  };

  const handleAddCustomAmenity = () => {
    const trimmed = amenityInput.trim();
    if (trimmed && !form.amenities.includes(trimmed)) {
      setForm({ ...form, amenities: [...form.amenities, trimmed] });
      setAmenityInput("");
    }
  };

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await client.integrations.Core.UploadPublicFile({ file });
      setForm((prev) => ({ ...prev, logo_url: file_url }));
      toast({ title: "Logo uploaded", description: "Remember to click Save Changes." });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const uploadGalleryImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await client.integrations.Core.UploadPublicFile({ file });
      setForm((prev) => ({ ...prev, gallery: [...prev.gallery, file_url] }));
      toast({ title: "Photo added to gallery", description: "Photo uploaded successfully." });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-9 h-9 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Loading Gym Profile...</p>
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${profile?.latitude || 28.4815},${profile?.longitude || 77.0818}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gym Profile"
        subtitle="Manage your brand, contact, operating hours, exact map location and amenities"
        action={
          <Button
            onClick={() => {
              setActiveTab("basic");
              setEditModalOpen(true);
            }}
            className="bg-primary text-primary-foreground gap-2 rounded-xl shadow-sm hover:bg-primary/90 h-10 px-4 text-xs font-semibold"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Profile</span>
          </Button>
        }
      />

      {/* Gym Hero Card */}
      <div className="rounded-3xl bg-gradient-to-br from-foreground via-foreground/95 to-foreground/80 text-white p-6 relative overflow-hidden shadow-sm">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/10 p-1 flex items-center justify-center overflow-hidden border border-white/20 shrink-0 shadow-md">
            {profile?.logo_url ? (
              <img
                src={getImageUrl(profile.logo_url)}
                alt="logo"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <Building2 className="w-10 h-10 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight truncate">
                {profile?.name || "Fitaval Health & Fitness"}
              </h2>
              <Badge variant="green" className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Check className="w-3 h-3 mr-1" />
                Verified Club
              </Badge>
            </div>
            <p className="text-white/70 text-sm mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>{profile?.address || "Address not configured"}, {profile?.city || ""}</span>
            </p>
          </div>
          <div className="flex sm:flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab("location");
                setEditModalOpen(true);
              }}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs rounded-xl"
            >
              <Compass className="w-3.5 h-3.5 mr-1" />
              Edit Location
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab("hours");
                setEditModalOpen(true);
              }}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs rounded-xl"
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              Operating Hours
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Contact & Basic Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Contact Details Card */}
          <div className="rounded-2xl bg-white border border-border p-5">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h3 className="font-bold text-foreground text-sm">Contact & Business Information</h3>
              <button
                onClick={() => {
                  setActiveTab("basic");
                  setEditModalOpen(true);
                }}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Edit
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Address
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {profile?.address || "Sector 18, Commercial Plaza, 3rd Floor"}
                  </p>
                  <p className="text-xs text-muted-foreground">{profile?.city || "Gurugram, Haryana"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Phone
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {profile?.phone || "+91 98765 43210"}
                  </p>
                  <p className="text-xs text-muted-foreground">General Enquiries & Desk</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Email
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {profile?.email || "info@fitaval.com"}
                  </p>
                  <p className="text-xs text-muted-foreground">Official Communications</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Operating Schedule
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5 truncate">
                    {profile?.operating_hours || "Mon – Sat: 5:30 AM – 10:30 PM"}
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab("hours");
                      setEditModalOpen(true);
                    }}
                    className="text-xs text-primary font-semibold hover:underline mt-0.5 inline-block"
                  >
                    View Weekly Timings →
                  </button>
                </div>
              </div>
            </div>

            {profile?.description && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  About Gym
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                  {profile.description}
                </p>
              </div>
            )}
          </div>

          {/* Operating Hours Preview Card */}
          <div className="rounded-2xl bg-white border border-border p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-foreground text-sm">Operating Hours (Weekly Schedule)</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTab("hours");
                  setEditModalOpen(true);
                }}
                className="text-xs h-8 rounded-xl border-border text-primary font-semibold hover:bg-primary/10"
              >
                Change Timings
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {[
                { day: "Monday", data: profile?.weekly_schedule?.monday },
                { day: "Tuesday", data: profile?.weekly_schedule?.tuesday },
                { day: "Wednesday", data: profile?.weekly_schedule?.wednesday },
                { day: "Thursday", data: profile?.weekly_schedule?.thursday },
                { day: "Friday", data: profile?.weekly_schedule?.friday },
                { day: "Saturday", data: profile?.weekly_schedule?.saturday },
                { day: "Sunday", data: profile?.weekly_schedule?.sunday },
              ].map(({ day, data }) => (
                <div
                  key={day}
                  className={`p-3 rounded-xl border transition-all ${
                    data?.enabled
                      ? "bg-white border-border"
                      : "bg-muted/40 border-border/60 opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{day}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        data?.enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {data?.enabled ? "Open" : "Closed"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 font-mono font-medium">
                    {data?.enabled ? `${data.open || "5:30 AM"} – ${data.close || "10:30 PM"}` : "Closed all day"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities Section */}
          <div className="rounded-2xl bg-white border border-border p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <h3 className="font-bold text-foreground text-sm">Amenities & Features</h3>
              <button
                onClick={() => {
                  setActiveTab("amenities");
                  setEditModalOpen(true);
                }}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Edit Amenities
              </button>
            </div>

            {profile?.amenities?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.amenities.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold border border-primary/20 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No amenities specified yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Exact Gym Location & Gallery */}
        <div className="space-y-5">
          {/* Gym Location Component / Card */}
          <div className="rounded-2xl bg-white border border-border p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-foreground text-sm">Gym Location</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTab("location");
                  setEditModalOpen(true);
                }}
                className="text-xs h-7 rounded-xl border-border text-primary font-semibold hover:bg-primary/10"
              >
                Change Location
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {profile?.address || "Sector 18, Commercial Plaza, 3rd Floor"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.city || "Gurugram, Haryana"}
                </p>
              </div>

              {/* Map Preview */}
              <div className="relative w-full h-44 rounded-xl overflow-hidden border border-border bg-slate-100 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px), radial-gradient(#cbd5e1 1px, #f8fafc 1px)`,
                    backgroundSize: "20px 20px",
                  }}
                >
                  <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-1/3 left-0 right-0 h-4 bg-slate-300 transform -rotate-6" />
                    <div className="absolute top-0 bottom-0 left-1/2 w-4 bg-slate-300" />
                  </div>
                </div>

                {/* Pin marker */}
                <div className="relative flex flex-col items-center z-10 animate-pulse">
                  <div className="p-2 rounded-full bg-primary text-white shadow-md border-2 border-white">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="w-2 h-1 bg-black/30 rounded-full blur-[1px] mt-0.5" />
                </div>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 z-20 flex items-center gap-1 bg-white/90 hover:bg-white text-[11px] font-medium text-primary px-2.5 py-1 rounded-lg border border-border shadow-xs"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Lat / Long info */}
              <div className="p-2.5 rounded-xl bg-muted/60 border border-border/80 font-mono text-xs flex justify-between items-center text-muted-foreground">
                <span>Latitude: {profile?.latitude || 28.4815}</span>
                <span>Longitude: {profile?.longitude || 77.0818}</span>
              </div>
            </div>
          </div>

          {/* Photo Gallery Card */}
          <div className="rounded-2xl bg-white border border-border p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <h3 className="font-bold text-foreground text-sm">Photo Gallery</h3>
              <button
                onClick={() => {
                  setActiveTab("gallery");
                  setEditModalOpen(true);
                }}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Manage Photos
              </button>
            </div>

            {profile?.gallery?.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {profile.gallery.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden bg-muted border border-border/60 hover:scale-[1.02] transition-transform"
                  >
                    <img
                      src={getImageUrl(url)}
                      alt="gym feature"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-border rounded-xl">
                <Camera className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No photos uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto no-scrollbar p-0 rounded-3xl bg-white border border-border">
          <div className="sticky top-0 bg-white z-20 px-6 pt-5 pb-3 border-b border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground flex items-center justify-between">
                <span>Edit Gym Profile</span>
              </DialogTitle>
            </DialogHeader>

            {/* Navigation Tabs inside modal */}
            <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar border-b border-border/60 pb-2">
              {[
                { key: "basic", label: "Basic Info" },
                { key: "hours", label: "Operating Hours" },
                { key: "location", label: "Gym Location" },
                { key: "amenities", label: "Amenities" },
                { key: "gallery", label: "Photo Gallery" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
            {/* Tab 1: Basic Information */}
            {activeTab === "basic" && (
              <div className="space-y-4">
                {/* Logo Uploader */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/80">
                  <Label className="text-xs font-semibold text-foreground">Gym Logo</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-border flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {form.logo_url ? (
                        <img
                          src={getImageUrl(form.logo_url)}
                          alt="logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold shadow-xs hover:bg-primary/90 transition-colors">
                        <Camera className="w-3.5 h-3.5" />
                        Change Logo
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Gym Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="mt-1.5 rounded-xl text-sm"
                    placeholder="Fitaval Health & Fitness Club"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Phone Number *</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                      className="mt-1.5 rounded-xl text-sm"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Email Address *</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="mt-1.5 rounded-xl text-sm"
                      placeholder="info@fitaval.com"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Street Address</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="mt-1.5 rounded-xl text-sm"
                    placeholder="Sector 18, Commercial Plaza, 3rd Floor"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">City & State</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="mt-1.5 rounded-xl text-sm"
                    placeholder="Gurugram, Haryana"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">About / Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-1.5 rounded-xl text-sm"
                    placeholder="Tell members about your club, equipment, philosophy..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Operating Hours Manager */}
            {activeTab === "hours" && (
              <div className="space-y-4">
                <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs text-muted-foreground">
                  Click on any open or close time button to open the WhatsApp-style circular clock picker.
                  Toggling a day off marks it as closed.
                </div>
                <OperatingHoursManager
                  value={form.weekly_schedule}
                  onChange={(sched) => setForm((prev) => ({ ...prev, weekly_schedule: sched }))}
                />
              </div>
            )}

            {/* Tab 3: Exact Gym Location Manager */}
            {activeTab === "location" && (
              <div className="space-y-4">
                <GymLocationPicker
                  address={form.address}
                  city={form.city}
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={(loc) => {
                    setForm((prev) => ({
                      ...prev,
                      address: loc.address,
                      city: loc.city,
                      latitude: loc.latitude,
                      longitude: loc.longitude,
                    }));
                  }}
                />
              </div>
            )}

            {/* Tab 4: Amenities Manager */}
            {activeTab === "amenities" && (
              <div className="space-y-4">
                <Label className="text-xs font-semibold">Add / Custom Amenity</Label>
                <div className="flex gap-2">
                  <Input
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    placeholder="Enter custom amenity (e.g. Olympic Barbell Zone)"
                    className="rounded-xl text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomAmenity();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="bg-primary text-white rounded-xl px-4 text-xs font-semibold"
                  >
                    Add
                  </Button>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                    Selectable Amenity Chips (Click to Toggle)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_AMENITIES.map((item) => {
                      const isSelected = form.amenities.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleToggleAmenity(item)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                              : "bg-white text-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {form.amenities.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-foreground mb-2">
                      Currently Selected ({form.amenities.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {form.amenities.map((a) => (
                        <span
                          key={a}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-accent text-accent-foreground font-medium border border-primary/20"
                        >
                          {a}
                          <button
                            type="button"
                            onClick={() => handleToggleAmenity(a)}
                            className="text-muted-foreground hover:text-red-600 ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Photo Gallery Manager */}
            {activeTab === "gallery" && (
              <div className="space-y-4">
                <Label className="text-xs font-semibold">Upload Gym Photos</Label>
                <label className="block">
                  <input type="file" accept="image/*" onChange={uploadGalleryImage} className="hidden" />
                  <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center cursor-pointer hover:bg-muted/40 transition-colors">
                    <Camera className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-xs font-semibold text-foreground">Click to upload gym photo</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG, WebP up to 10MB</p>
                  </div>
                </label>

                {form.gallery.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">
                      Gallery Images ({form.gallery.length})
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {form.gallery.map((url, i) => (
                        <div
                          key={i}
                          className="relative aspect-square rounded-xl overflow-hidden border border-border shadow-xs group"
                        >
                          <img
                            src={getImageUrl(url)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                gallery: form.gallery.filter((_, idx) => idx !== i),
                              })
                            }
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-sm"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer Controls */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="flex-1 rounded-xl h-11 border-border text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl h-11 bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                {saving ? "Saving Changes..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}