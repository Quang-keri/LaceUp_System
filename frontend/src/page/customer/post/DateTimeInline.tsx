import { ConfigProvider } from "antd";
import type { FilterState } from "./PostPage";

interface DateTimeInlineProps {
  filters: FilterState;
  onChange: (newFilters: Partial<FilterState>) => void;
}

export default function DateTimeInline({
  filters,
  onChange,
}: DateTimeInlineProps) {
  const isoToTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const timeToIso = (dateStr: string | undefined, timeStr: string) => {
    const date = dateStr || new Date().toISOString().slice(0, 10);
    const dt = new Date(`${date}T${timeStr}`);
    return isNaN(dt.getTime()) ? undefined : dt.toISOString();
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#9156F1",
          borderRadius: 12,
          controlHeight: 44,
        },
      }}
    >
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={filters.date || ""}
          onChange={(e) => onChange({ date: e.target.value })}
          className="bg-white text-gray-900 border border-gray-100 rounded-xl p-2 text-sm shadow-sm outline-none"
        />

        <input
          type="time"
          value={isoToTime(filters.startDateTime)}
          onChange={(e) => {
            const iso = e.target.value
              ? timeToIso(filters.date, e.target.value)
              : undefined;
            onChange({ startDateTime: iso, date: filters.date || undefined });
          }}
          className="bg-white text-gray-900 border border-gray-100 rounded-xl p-2 text-sm shadow-sm outline-none"
        />

        <input
          type="time"
          value={isoToTime(filters.endDateTime)}
          onChange={(e) => {
            const iso = e.target.value
              ? timeToIso(filters.date, e.target.value)
              : undefined;
            onChange({ endDateTime: iso, date: filters.date || undefined });
          }}
          className="bg-white text-gray-900 border border-gray-100 rounded-xl p-2 text-sm shadow-sm outline-none"
        />
      </div>
    </ConfigProvider>
  );
}
