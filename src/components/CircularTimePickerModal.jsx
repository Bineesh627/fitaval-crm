import React, { useState } from "react";
import { Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Circular Clock Time Picker
 * WhatsApp Business / Material Clock style
 * Allows selection of Hour, Minute, and AM/PM
 */
export function CircularTimePickerModal({
  open,
  onClose,
  initialTime = "06:00 AM",
  title = "Select Time",
  onSave,
}) {
  // Parse initialTime: "5:30 AM" or "05:30 PM"
  const parseTime = (str) => {
    try {
      const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let h = parseInt(match[1], 10);
        let m = parseInt(match[2], 10);
        let period = match[3].toUpperCase();
        if (h === 0) h = 12;
        if (h > 12) h = 12;
        return { hour: h, minute: m, period };
      }
    } catch {
      // fallback
    }
    return { hour: 6, minute: 0, period: "AM" };
  };

  const [mode, setMode] = useState("hour"); // 'hour' | 'minute'
  const parsed = parseTime(initialTime);
  const [selectedHour, setSelectedHour] = useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState(parsed.period);

  // Sync when initialTime changes or modal opens
  React.useEffect(() => {
    if (open) {
      const p = parseTime(initialTime);
      setSelectedHour(p.hour);
      setSelectedMinute(p.minute);
      setPeriod(p.period);
      setMode("hour");
    }
  }, [open, initialTime]);

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const handleHourClick = (h) => {
    setSelectedHour(h);
    // automatically transition to minute mode like WhatsApp
    setMode("minute");
  };

  const handleMinuteClick = (m) => {
    setSelectedMinute(m);
  };

  const handleConfirm = () => {
    const formattedHour = selectedHour.toString();
    const formattedMin = selectedMinute.toString().padStart(2, "0");
    const result = `${formattedHour}:${formattedMin} ${period}`;
    onSave?.(result);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      <DialogContent className="max-w-[340px] sm:max-w-[360px] p-5 rounded-3xl bg-white border border-border">
        <DialogHeader className="text-center sm:text-center pb-1">
          <div className="flex items-center justify-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{title}</span>
          </div>
          <DialogTitle className="text-base text-foreground font-bold">
            Set Operating Time
          </DialogTitle>
        </DialogHeader>

        {/* Digital display & AM/PM toggle */}
        <div className="flex items-center justify-center gap-3 my-2 bg-muted/50 py-3 px-4 rounded-2xl border border-border/60">
          <div className="flex items-baseline gap-1 font-mono text-3xl font-bold">
            <button
              type="button"
              onClick={() => setMode("hour")}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                mode === "hour"
                  ? "bg-primary text-white shadow-sm ring-2 ring-primary/20 scale-105"
                  : "bg-white text-foreground hover:bg-muted"
              }`}
            >
              {selectedHour}
            </button>
            <span className="text-muted-foreground font-bold text-2xl">:</span>
            <button
              type="button"
              onClick={() => setMode("minute")}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                mode === "minute"
                  ? "bg-primary text-white shadow-sm ring-2 ring-primary/20 scale-105"
                  : "bg-white text-foreground hover:bg-muted"
              }`}
            >
              {selectedMinute.toString().padStart(2, "0")}
            </button>
          </div>

          {/* AM / PM switcher */}
          <div className="flex flex-col gap-1 border-l border-border/80 pl-3">
            <button
              type="button"
              onClick={() => setPeriod("AM")}
              className={`px-2 py-0.5 rounded text-xs font-bold uppercase transition-colors ${
                period === "AM"
                  ? "bg-primary text-white"
                  : "bg-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setPeriod("PM")}
              className={`px-2 py-0.5 rounded text-xs font-bold uppercase transition-colors ${
                period === "PM"
                  ? "bg-primary text-white"
                  : "bg-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              PM
            </button>
          </div>
        </div>

        {/* Mode subtitle */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <span>{mode === "hour" ? "Pick hour" : "Pick minutes"}</span>
          <button
            type="button"
            onClick={() => setMode(mode === "hour" ? "minute" : "hour")}
            className="text-primary font-semibold hover:underline"
          >
            Switch to {mode === "hour" ? "minutes" : "hours"}
          </button>
        </div>

        {/* Circular Clock Dial */}
        <div className="relative w-64 h-64 mx-auto my-2 rounded-full bg-muted/40 border border-border flex items-center justify-center select-none shadow-inner">
          {/* Center Pivot */}
          <div className="absolute w-3 h-3 rounded-full bg-primary z-20 shadow-sm" />

          {/* Clock Hand */}
          {(() => {
            const angle =
              mode === "hour"
                ? (selectedHour % 12) * 30
                : (selectedMinute / 60) * 360;
            return (
              <div
                className="absolute w-0.5 bg-primary origin-bottom pointer-events-none transition-transform duration-200 z-10"
                style={{
                  height: "88px",
                  bottom: "50%",
                  transform: `rotate(${angle}deg)`,
                }}
              >
                {/* Hand End Circle */}
                <div className="absolute -top-3.5 -left-3.5 w-7 h-7 rounded-full bg-primary/20 border-2 border-primary" />
              </div>
            );
          })()}

          {/* Hour or Minute numbers arranged in circle (radius ~ 92px) */}
          {(mode === "hour" ? hours : minutes).map((val, index) => {
            const angle = (index * 30 - 90) * (Math.PI / 180);
            const radius = 92;
            const x = Math.round(Math.cos(angle) * radius);
            const y = Math.round(Math.sin(angle) * radius);

            const isSelected =
              mode === "hour" ? selectedHour === val : selectedMinute === val;

            return (
              <button
                key={val}
                type="button"
                onClick={() =>
                  mode === "hour" ? handleHourClick(val) : handleMinuteClick(val)
                }
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
                className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all z-10 ${
                  isSelected
                    ? "bg-primary text-white font-bold shadow-md scale-110"
                    : "text-foreground hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {mode === "minute" ? val.toString().padStart(2, "0") : val}
              </button>
            );
          })}
        </div>

        {/* Quick presets for common gym times */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          {["05:30 AM", "06:00 AM", "08:00 PM", "10:00 PM", "10:30 PM"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                const p = parseTime(t);
                setSelectedHour(p.hour);
                setSelectedMinute(p.minute);
                setPeriod(p.period);
              }}
              className="px-2 py-0.5 rounded-md text-[11px] bg-secondary hover:bg-primary/10 hover:text-primary text-muted-foreground font-medium transition-colors"
            >
              {t}
            </button>
          ))}
        </div>

        <DialogFooter className="flex items-center gap-2 pt-3 sm:justify-between border-t border-border mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl h-10 border-border text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-xl h-10 bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
          >
            Confirm Time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CircularTimePickerModal;
