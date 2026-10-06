import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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

export const DEFAULT_TRAINER_SCHEDULE = {
  monday: { enabled: true, open: "06:00 AM", close: "02:00 PM" },
  tuesday: { enabled: true, open: "06:00 AM", close: "02:00 PM" },
  wednesday: { enabled: true, open: "06:00 AM", close: "02:00 PM" },
  thursday: { enabled: true, open: "06:00 AM", close: "02:00 PM" },
  friday: { enabled: true, open: "06:00 AM", close: "02:00 PM" },
  saturday: { enabled: false, open: "06:00 AM", close: "02:00 PM" },
  sunday: { enabled: false, open: "06:00 AM", close: "02:00 PM" },
};

function parseInitialSchedule(workingDays = "", workingHours = "") {
  let start = "06:00 AM";
  let end = "02:00 PM";
  if (workingHours) {
    const parts = workingHours.split(/–|-|to/);
    if (parts.length >= 2) {
      start = parts[0].trim() || "06:00 AM";
      end = parts[1].trim() || "02:00 PM";
    }
  }

  const s = (workingDays || "").toLowerCase();
  const schedule = {};

  DAYS_OF_WEEK.forEach(({ key }) => {
    let enabled = false;
    if (!workingDays || s.includes("mon – fri") || s.includes("monday – friday") || s.includes("monday - friday")) {
      enabled = ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(key);
    } else if (s.includes("mon – sat") || s.includes("monday – saturday") || s.includes("monday - saturday")) {
      enabled = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].includes(key);
    } else if (s.includes("all week") || s.includes("monday – sunday") || s.includes("monday - sunday")) {
      enabled = true;
    } else if (s.includes("weekend") || s.includes("sat – sun") || s.includes("saturday – sunday")) {
      enabled = ["saturday", "sunday"].includes(key);
    } else {
      enabled = s.includes(key) || s.includes(key.slice(0, 3));
    }

    schedule[key] = {
      enabled,
      open: start,
      close: end,
    };
  });

  return schedule;
}

function deriveDaysString(schedule) {
  const activeKeys = DAYS_OF_WEEK.filter((d) => schedule[d.key]?.enabled).map((d) => d.key);
  if (activeKeys.length === 0) return "None";
  if (activeKeys.length === 7) return "Monday – Sunday";

  const isWeekdays =
    ["monday", "tuesday", "wednesday", "thursday", "friday"].every((d) => activeKeys.includes(d)) &&
    activeKeys.length === 5;
  if (isWeekdays) return "Monday – Friday";

  const isSixDays =
    ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].every((d) => activeKeys.includes(d)) &&
    activeKeys.length === 6;
  if (isSixDays) return "Monday – Saturday";

  const isWeekend =
    activeKeys.length === 2 && activeKeys.includes("saturday") && activeKeys.includes("sunday");
  if (isWeekend) return "Saturday – Sunday";

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  return activeKeys.map((k) => capitalize(k.slice(0, 3))).join(", ");
}

function deriveHoursString(schedule) {
  const firstActive = DAYS_OF_WEEK.find((d) => schedule[d.key]?.enabled);
  if (firstActive && schedule[firstActive.key]) {
    return `${schedule[firstActive.key].open || "06:00 AM"} – ${schedule[firstActive.key].close || "02:00 PM"}`;
  }
  return "06:00 AM – 02:00 PM";
}

/**
 * Exact Operating Hours Design from Gym Profile applied to Trainer Add/Edit
 */
export default function TrainerSchedulePicker({
  workingDays = "Monday – Friday",
  workingHours = "06:00 AM – 02:00 PM",
  onChangeDays,
  onChangeHours,
  onChangeSchedule,
}) {
  const [schedule, setSchedule] = useState(() =>
    parseInitialSchedule(workingDays, workingHours)
  );

  const [pickerState, setPickerState] = useState({
    open: false,
    dayKey: null,
    field: null, // 'open' | 'close'
    currentTime: "06:00 AM",
    title: "",
  });

  const notifyChange = (newSchedule) => {
    setSchedule(newSchedule);
    onChangeDays?.(deriveDaysString(newSchedule));
    onChangeHours?.(deriveHoursString(newSchedule));
    onChangeSchedule?.(newSchedule);
  };

  const handleToggle = (dayKey) => {
    const updated = {
      ...schedule,
      [dayKey]: {
        ...schedule[dayKey],
        enabled: !schedule[dayKey]?.enabled,
      },
    };
    notifyChange(updated);
  };

  const openPicker = (dayKey, field, dayLabel) => {
    const currentTime = schedule[dayKey]?.[field] || "06:00 AM";
    setPickerState({
      open: true,
      dayKey,
      field,
      currentTime,
      title: `${dayLabel} (${field === "open" ? "Shift Start" : "Shift End"})`,
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
    notifyChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">
          Operating Hours & Shift
        </label>
        <span className="text-[11px] font-medium text-muted-foreground">
          {deriveDaysString(schedule)} ({deriveHoursString(schedule)})
        </span>
      </div>

      {/* Exact Gym Profile Operating Hours Card Design */}
      <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        {DAYS_OF_WEEK.map(({ key, label }) => {
          const day = schedule[key] || {
            enabled: false,
            open: "06:00 AM",
            close: "02:00 PM",
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
                    className="flex flex-col items-start p-2.5 rounded-xl bg-secondary/80 hover:bg-primary/10 hover:border-primary/40 border border-border transition-colors text-left min-h-[48px] cursor-pointer"
                  >
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Shift Start
                    </span>
                    <span className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      {day.open || "06:00 AM"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openPicker(key, "close", label)}
                    className="flex flex-col items-start p-2.5 rounded-xl bg-secondary/80 hover:bg-primary/10 hover:border-primary/40 border border-border transition-colors text-left min-h-[48px] cursor-pointer"
                  >
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Shift End
                    </span>
                    <span className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      {day.close || "02:00 PM"}
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

      {/* Circular Clock Bottom Sheet Modal */}
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
