import React, { useState } from "react";
import { MapPin, Navigation, Search, Check, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui-shared";

/**
 * Common locations for fast search suggestions
 */
const PRESET_LOCATIONS = [
  { name: "Sector 18, Commercial Plaza, Gurugram", lat: 28.4815, lng: 77.0818, city: "Gurugram, Haryana" },
  { name: "Indiranagar 100ft Road, Bengaluru", lat: 12.9719, lng: 77.6412, city: "Bengaluru, Karnataka" },
  { name: "Bandra West, Hill Road, Mumbai", lat: 19.0596, lng: 72.8295, city: "Mumbai, Maharashtra" },
  { name: "Connaught Place, Central Circle, New Delhi", lat: 28.6315, lng: 77.2167, city: "New Delhi" },
  { name: "Koramangala 4th Block, Bengaluru", lat: 12.9352, lng: 77.6245, city: "Bengaluru, Karnataka" },
  { name: "Jubilee Hills Check Post, Hyderabad", lat: 17.4325, lng: 78.4071, city: "Hyderabad, Telangana" },
];

export function GymLocationPicker({
  address = "",
  city = "",
  latitude = 28.4815,
  longitude = 77.0818,
  onChange,
}) {
  const [currentAddress, setCurrentAddress] = useState(address || "Sector 18, Commercial Plaza, 3rd Floor");
  const [currentCity, setCurrentCity] = useState(city || "Gurugram, Haryana");
  const [lat, setLat] = useState(latitude || 28.4815);
  const [lng, setLng] = useState(longitude || 77.0818);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);

    // Check against preset locations or simulate geocode
    const found = PRESET_LOCATIONS.find((loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setTimeout(() => {
      if (found) {
        setLat(found.lat);
        setLng(found.lng);
        setCurrentAddress(found.name);
        setCurrentCity(found.city);
      } else {
        // pseudo geocode near entered query
        const pseudoLat = 28.45 + (Math.random() * 0.1);
        const pseudoLng = 77.05 + (Math.random() * 0.1);
        setLat(Number(pseudoLat.toFixed(5)));
        setLng(Number(pseudoLng.toFixed(5)));
        setCurrentAddress(searchQuery);
      }
      setSearching(false);
    }, 400);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(5));
        const userLng = Number(pos.coords.longitude.toFixed(5));
        setLat(userLat);
        setLng(userLng);
        setGeoLoading(false);
      },
      () => {
        // Fallback demo location if permissions denied
        setGeoLoading(false);
        setLat(28.4815);
        setLng(77.0818);
      },
      { timeout: 8000 }
    );
  };

  const handleConfirmLocation = () => {
    setConfirmed(true);
    onChange?.({
      address: currentAddress,
      city: currentCity,
      latitude: Number(lat),
      longitude: Number(lng),
    });
    setTimeout(() => setConfirmed(false), 2500);
  };

  // Google Maps directions / view link
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div>
        <Label className="text-xs font-semibold text-foreground">Search Location</Label>
        <form onSubmit={handleSearch} className="flex gap-2 mt-1.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, landmark, commercial plaza..."
              className="pl-9 text-sm rounded-xl"
            />
          </div>
          <Button
            type="submit"
            disabled={searching}
            variant="outline"
            className="rounded-xl border-border px-4 text-xs font-medium"
          >
            {searching ? "Searching..." : "Search"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleUseCurrentLocation}
            disabled={geoLoading}
            className="rounded-xl border-border px-3 text-xs font-medium gap-1 text-primary hover:bg-primary/10"
            title="Use device GPS"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Use Current Location</span>
          </Button>
        </form>
      </div>

      {/* Suggested Quick Locations */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <span className="text-[11px] text-muted-foreground shrink-0 font-medium">Suggestions:</span>
        {PRESET_LOCATIONS.slice(0, 3).map((loc) => (
          <button
            key={loc.name}
            type="button"
            onClick={() => {
              setLat(loc.lat);
              setLng(loc.lng);
              setCurrentAddress(loc.name);
              setCurrentCity(loc.city);
            }}
            className="text-[11px] bg-secondary hover:bg-primary/10 hover:text-primary px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border border-border/60"
          >
            {loc.name.split(",")[0]}
          </button>
        ))}
      </div>

      {/* Interactive Map Preview with Pin Marker */}
      <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-border shadow-inner bg-slate-100">
        {/* Styled Map Canvas / Tile Simulation */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-300"
          style={{
            backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px), radial-gradient(#cbd5e1 1px, #f8fafc 1px)`,
            backgroundSize: "24px 24px",
            backgroundPosition: "0 0, 12px 12px",
          }}
        >
          {/* Simulated Street Grid Lines */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-1/4 left-0 right-0 h-4 bg-slate-300 transform -rotate-3" />
            <div className="absolute top-2/3 left-0 right-0 h-6 bg-slate-300/80 transform rotate-1" />
            <div className="absolute top-0 bottom-0 left-1/3 w-5 bg-slate-300/80" />
            <div className="absolute top-0 bottom-0 left-2/3 w-4 bg-slate-300/90 transform -rotate-1" />
            <div className="absolute top-1/3 right-1/4 w-28 h-20 bg-green-100/80 rounded-xl border border-green-200 flex items-center justify-center text-[10px] text-green-700 font-bold">
              Gym Zone
            </div>
          </div>
        </div>

        {/* Center Pin Marker */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center animate-bounce">
            <div className="bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="w-2.5 h-1 bg-black/30 rounded-full blur-[1px] mt-0.5" />
          </div>
          <div className="mt-1 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-sm border border-border text-[11px] font-semibold text-foreground max-w-[200px] truncate text-center">
            {currentAddress}
          </div>
        </div>

        {/* Coordinates badge overlay */}
        <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-border text-[11px] text-foreground font-mono">
          <span className="text-primary font-bold">●</span>
          <span>Lat: {lat}</span>
          <span className="text-muted-foreground">|</span>
          <span>Lng: {lng}</span>
        </div>

        {/* Google Maps link overlay */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-white/90 hover:bg-white backdrop-blur-md px-2.5 py-1 rounded-lg border border-border text-[11px] font-medium text-primary shadow-sm transition-all"
        >
          <span>Open Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Editable Address Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <Label className="text-xs text-muted-foreground">Detailed Address</Label>
          <Input
            value={currentAddress}
            onChange={(e) => setCurrentAddress(e.target.value)}
            placeholder="Commercial Plaza, Floor 3"
            className="mt-1 text-sm rounded-xl"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">City & State</Label>
          <Input
            value={currentCity}
            onChange={(e) => setCurrentCity(e.target.value)}
            placeholder="Gurugram, Haryana"
            className="mt-1 text-sm rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Latitude</Label>
          <Input
            type="number"
            step="0.00001"
            value={lat}
            onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
            className="mt-1 text-xs font-mono rounded-xl"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Longitude</Label>
          <Input
            type="number"
            step="0.00001"
            value={lng}
            onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
            className="mt-1 text-xs font-mono rounded-xl"
          />
        </div>
      </div>

      {/* Confirm Button */}
      <div className="pt-1">
        <Button
          type="button"
          onClick={handleConfirmLocation}
          className={`w-full rounded-xl h-11 text-sm font-semibold transition-all ${
            confirmed
              ? "bg-green-600 text-white"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {confirmed ? (
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Location Confirmed & Linked
            </span>
          ) : (
            "Confirm Location"
          )}
        </Button>
      </div>
    </div>
  );
}

export default GymLocationPicker;
