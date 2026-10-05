import React, { useState } from "react";
import { Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import CircularTimePickerModal from "./CircularTimePickerModal";

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export const DEFAULT_WEEK_SCHEDULE = {
  monday: { enabled: true, open: "5:30 AM", close: "10:30 PM" },
  tuesday: { enabled: true, open: "5:30 AM", close: "10:30 PM" },
  wednesday: { enabled: true, open: "5:30 AM", close: "10:30 PM" },
  thursday: { enabled: true, open: "5:30 AM", close: "10:30 PM" },
  friday: { enabled: true, open: "5:30 AM", close: "10:30 PM" },
  saturday: { enabled: true, open: "5:30 AM", close: "10:30 PM" },
  sunday: { enabled: false, open: "7:00 AM", close: "8:00 PM" },
};

export function formatWeeklyScheduleSummary(schedule) {
  if (!schedule) return "Monday – Saturday: 5:30 AM – 10:30 PM | Sunday: Closed";
  const weekdaysOpen = ["monday", "tuesday", "wednesday", "thursday", "friday"].every(
    (k) =>
      schedule[k]?.enabled &&
      schedule[k]?.open === schedule.monday?.open &&
      schedule[k]?.close === schedule.monday?.close
  );
  if (
    weekdaysOpen &&
    schedule.saturday?.enabled &&
    schedule.saturday?.open === schedule.monday?.open
  ) {
    const sun = schedule.sunday?.enabled
      ? `Sunday: ${schedule.sunday.open} – ${schedule.sunday.close}`
      : "Sunday: Closed";
    return `Mon – Sat: ${schedule.monday.open} – ${schedule.monday.close} | ${sun}`;
  }
  return "Custom weekly operating schedule configured";
}

/**
 * Mobile-First Operating Hours Manager
 * Touch-friendly rows with WhatsApp business toggles
 */
export function OperatingHoursManager({ value, onChange }) {
  const schedule = value || DEFAULT_WEEK_SCHEDULE;
  const [pickerState, setPickerState] = useState({
    open: false,
    dayKey: null,
    field: null, // 'open' | 'close'
    currentTime: "5:30 AM",
    title: "",
  });

  const handleToggle = (dayKey) => {
    const updated = {
      ...schedule,
      [dayKey]: {
        ...schedule[dayKey],
        enabled: !schedule[dayKey]?.enabled,
      },
    };
    onChange?.(updated);
  };

  const openPicker = (dayKey, field, dayLabel) => {
    const currentTime = schedule[dayKey]?.[field] || "6:00 AM";
    setPickerState({
      open: true,
      dayKey,
      field,
      currentTime,
      title: `${dayLabel} (${field === "open" ? "Opening" : "Closing"})`,
    });
  };

  const handleSaveTime = (newTime) => {
    if (!pickerState.dayKey || !pickerState.field) return;
    const updated = {
      ...schedule,
      [pickerState.dayKey]: {
        ...schedule[pickerState.dayKey],
        [pickerState.field]: newTime,
      },
    };
    onChange?.(updated);
  };

  return (
    <div className="space-y-3">
      {/* Weekday list */}
      <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        {DAYS_OF_WEEK.map(({ key, label }) => {
          const day = schedule[key] || {
            enabled: false,
            open: "6:00 AM",
            close: "10:00 PM",
          };
          const isOpen = day.enabled;

          return (
            <div
              key={key}
              className={`p-3.5 sm:p-4 flex flex-col gap-2.5 transition-colors ${
                isOpen ? "bg-card" : "bg-muted/20"
              }`}
            >
              {/* Day title and toggle switch */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isOpen ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
                    }`}
                  />
                  <span className="font-bold text-sm text-foreground">{label}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-xs font-semibold ${
                      isOpen ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {isOpen ? "Open" : "Closed"}
                  </span>
                  <Switch
                    checked={isOpen}
                    onCheckedChange={() => handleToggle(key)}
                    className="touch-manipulation"
                  />
                </div>
              </div>

              {/* Timing buttons or Closed state */}
              {isOpen ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openPicker(key, "open", label)}
                    className="flex flex-col items-start p-2.5 rounded-xl bg-secondary/80 hover:bg-primary/10 hover:border-primary/40 border border-border transition-colors text-left min-h-[48px]"
                  >
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Opening Time
                    </span>
                    <span className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      {day.open || "5:30 AM"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openPicker(key, "close", label)}
                    className="flex flex-col items-start p-2.5 rounded-xl bg-secondary/80 hover:bg-primary/10 hover:border-primary/40 border border-border transition-colors text-left min-h-[48px]"
                  >
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Closing Time
                    </span>
                    <span className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      {day.close || "10:30 PM"}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="text-xs font-medium text-muted-foreground bg-muted/60 p-2 rounded-xl text-center">
                  Closed all day
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Circular Clock Bottom Sheet */}
      <CircularTimePickerModal
        open={pickerState.open}
        onClose={() => setPickerState((prev) => ({ ...prev, open: false }))}
        initialTime={pickerState.currentTime}
        title={pickerState.title}
        onSave={handleSaveTime}
      />
    </div>
  );
}

export default OperatingHoursManager;
