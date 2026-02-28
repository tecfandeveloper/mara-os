"use client";

import { useState, useRef } from "react";
import { format, parseISO } from "date-fns";
import { Download } from "lucide-react";
import { exportElementAsPng } from "@/lib/export-image";

interface DateHourDatum {
  date: string;
  hour: number;
  count: number;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const THEME = {
  accent: "#FF3B30",
  border: "#2A2A2A",
  card: "#1A1A1A",
  textPrimary: "#FFFFFF",
  textSecondary: "#8A8A8A",
  textMuted: "#525252",
};

function getIntensityStyle(count: number, max: number): React.CSSProperties {
  if (count === 0) return { backgroundColor: THEME.border };
  const intensity = count / max;
  const opacity = 0.2 + intensity * 0.8;
  return { backgroundColor: THEME.accent, opacity };
}

interface ActivityHeatmap24x7Props {
  heatmapByDateHour: DateHourDatum[];
  heatmapDates: string[];
  onCellClick?: (date: string, hour: number) => void;
  showExport?: boolean;
}

export function ActivityHeatmap24x7({
  heatmapByDateHour,
  heatmapDates,
  onCellClick,
  showExport = true,
}: ActivityHeatmap24x7Props) {
  const [tooltip, setTooltip] = useState<{ show: boolean; x: number; y: number; text: string }>({
    show: false,
    x: 0,
    y: 0,
    text: "",
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const dataMap = new Map<string, number>();
  heatmapByDateHour.forEach((d) => {
    dataMap.set(`${d.date}-${d.hour}`, d.count);
  });
  const maxCount = Math.max(...heatmapByDateHour.map((d) => d.count), 1);

  const handleMouseEnter = (
    e: React.MouseEvent,
    date: string,
    hour: number,
    count: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let dateLabel = date;
    try {
      dateLabel = format(parseISO(date), "EEE MMM d");
    } catch {}
    setTooltip({
      show: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      text: `${dateLabel} ${hour}:00 — ${count} activities`,
    });
  };

  const handleMouseLeave = () => setTooltip({ show: false, x: 0, y: 0, text: "" });

  const handleExport = () => {
    if (containerRef.current) {
      exportElementAsPng(containerRef.current, "activity-heatmap-24x7");
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs" style={{ color: THEME.textMuted }}>
          Click a cell to filter activity feed by that day
        </p>
        {showExport && (
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors"
            style={{
              color: "var(--accent)",
              backgroundColor: "transparent",
              border: "1px solid var(--border)",
            }}
          >
            <Download size={12} />
            Export image
          </button>
        )}
      </div>
      <div ref={containerRef}>
        <div className="flex ml-12 mb-1">
          {HOURS.filter((h) => h % 3 === 0).map((hour) => (
            <div key={hour} className="text-xs" style={{ width: "36px", color: THEME.textMuted }}>
              {hour}:00
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1">
          {heatmapDates.map((date, rowIndex) => {
            let dateLabel = date;
            try {
              dateLabel = format(parseISO(date), "MMM d");
            } catch {}
            return (
              <div key={date} className="flex items-center gap-1">
                <span
                  className="w-10 text-xs text-right pr-2"
                  style={{ color: THEME.textSecondary }}
                >
                  {dateLabel}
                </span>
                <div className="flex gap-0.5">
                  {HOURS.map((hour) => {
                    const count = dataMap.get(`${date}-${hour}`) || 0;
                    return (
                      <div
                        key={hour}
                        role={onCellClick ? "button" : undefined}
                        className="w-3 h-3 rounded-sm transition-transform hover:scale-125"
                        style={{
                          ...getIntensityStyle(count, maxCount),
                          cursor: onCellClick ? "pointer" : "default",
                        }}
                        onMouseEnter={(e) => handleMouseEnter(e, date, hour, count)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => onCellClick?.(date, hour)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-end gap-2 mt-3">
          <span className="text-xs" style={{ color: THEME.textMuted }}>Less</span>
          <div className="flex gap-0.5">
            {[0, 0.3, 0.5, 0.75, 1].map((op) => (
              <div
                key={op}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: THEME.accent, opacity: op }}
              />
            ))}
          </div>
          <span className="text-xs" style={{ color: THEME.textMuted }}>More</span>
        </div>
      </div>
      {tooltip.show && (
        <div
          className="fixed z-50 px-2 py-1 text-xs rounded shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
            backgroundColor: THEME.card,
            color: THEME.textPrimary,
            border: `1px solid ${THEME.border}`,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
