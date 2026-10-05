import React, { useState } from "react";
import { Clock, Copy, Check } from "lucide-react";
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

/**
 * Parses a schedule object into a readable single-line summary string
 */
export function formatWeeklyScheduleSummary(schedule) {
  if (!schedule) return "Monday – Saturday: 5:30 AM – 10:30 PM | Sunday: Closed";
  const weekdaysOpen = ["monday", "tuesday", "wednesday", "thursday", "friday"].every(
    (k) => schedule[k]?.enabled && schedule[k]?.open === schedule.monday?.open && schedule[k]?.close === schedule.monday?.close
  );
  if (weekdaysOpen && schedule.saturday?.enabled && schedule.saturday?.open === schedule.monday?.open) {
    const sun = schedule.sunday?.enabled
      ? `Sunday: ${schedule.sunday.open} – ${schedule.sunday.close}`
      : "Sunday: Closed";
    return `Mon – Sat: ${schedule.monday.open} – ${schedule.monday.close} | ${sun}`;
  }
  return "Custom weekly operating schedule configured";
}

/**
 * Operating Hours Manager component
 * Supports WhatsApp Business style toggles and circular clock pickers
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
  const [copiedNotification, setCopiedNotification] = useState(false);

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

  const applyToAllWeekdays = () => {
    const mondayConfig = schedule.monday || { enabled: true, open: "5:30 AM", close: "10:30 PM" };
    const updated = { ...schedule };
    ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].forEach((d) => {
      updated[d] = { ...mondayConfig };
    });
    onChange?.(updated);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header action: apply to all weekdays */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-accent/40 rounded-2xl border border-primary/20">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            WhatsApp Business-style Schedule
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={applyToAllWeekdays}
          className="rounded-xl h-8 px-3 text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5 font-medium"
        >
          {copiedNotification ? (
            <>
              <Check className="w-3.5 h-3.5 text-primary" />
              Applied to Weekdays!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Apply Monday to Mon–Sat
            </>
          )}
        </Button>
      </div>

      {/* Weekday list */}
      <div className="divide-y divide-border rounded-2xl border border-border bg-white overflow-hidden">
        {DAYS_OF_WEEK.map(({ key, label }) => {
          const day = schedule[key] || { enabled: false, open: "6:00 AM", close: "10:00 PM" };
          const isOpen = day.enabled;

          return (
            <div
              key={key}
              className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                isOpen ? "bg-white" : "bg-muted/30"
              }`}
            >
              {/* Day title & status */}
              <div className="flex items-center justify-between sm:justify-start gap-3 min-w-[140px]">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isOpen ? "bg-primary animate-pulse" : "bg-muted-foreground/40"
                    }`}
                  />
                  <span className="font-semibold text-sm text-foreground">{label}</span>
                </div>
                <div className="flex items-center gap-2 sm:hidden">
                  <span className="text-xs font-medium text-muted-foreground">
                    {isOpen ? "Open" : "Closed"}
                  </span>
                  <Switch checked={isOpen} onCheckedChange={() => handleToggle(key)} />
                </div>
              </div>

              {/* Time selection or Closed badge */}
              <div className="flex items-center justify-between sm:justify-end gap-3 flex-1">
                {isOpen ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground font-medium">Open:</span>
                      <button
                        type="button"
                        onClick={() => openPicker(key, "open", label)}
                        className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary hover:border-primary/40 border border-border text-xs font-semibold text-foreground transition-all flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {day.open || "5:30 AM"}
                      </button>
                    </div>

                    <span className="text-muted-foreground text-xs">–</span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground font-medium">Close:</span>
                      <button
                        type="button"
                        onClick={() => openPicker(key, "close", label)}
                        className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary hover:border-primary/40 border border-border text-xs font-semibold text-foreground transition-all flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {day.close || "10:30 PM"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-medium text-muted-foreground/70 bg-muted px-2.5 py-1 rounded-md">
                    Closed all day
                  </div>
                )}

                {/* Desktop switch */}
                <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border/60">
                  <span className="text-xs font-medium text-muted-foreground min-w-[42px] text-right">
                    {isOpen ? "Open" : "Closed"}
                  </span>
                  <Switch checked={isOpen} onCheckedChange={() => handleToggle(key)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Circular Clock Popup */}
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
