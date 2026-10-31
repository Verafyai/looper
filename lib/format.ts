const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function partsInPt(iso: string): {
  weekday: string;
  month: string;
  day: number;
  hour: number;
  minute: number;
  ampm: "AM" | "PM";
} {
  const date = new Date(iso);
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h12",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => formatted.find((part) => part.type === type)?.value ?? "";
  const minute = Number(pick("minute"));
  const day = Number(pick("day"));
  const hour = Number(pick("hour"));
  const dayPeriod = pick("dayPeriod").toUpperCase() === "PM" ? "PM" : "AM";
  return {
    weekday: pick("weekday").replace(",", ""),
    month: pick("month"),
    day,
    hour,
    minute,
    ampm: dayPeriod,
  };
}

export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return "no data";
  if (seconds < 90) return `${Math.round(seconds)} s`;
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

export function formatSnapshot(iso: string): string {
  return formatRunStamp(iso);
}

export function formatRunStamp(iso: string): string {
  const part = partsInPt(iso);
  const minute = String(part.minute).padStart(2, "0");
  return `${part.weekday} ${part.month} ${part.day}, ${part.hour}:${minute} ${part.ampm} PT`;
}

export function formatRunMeta(run: {
  n: number;
  started_at: string;
  duration_s: number;
  cost_usd: number;
}): string {
  return `Run #${run.n} · ${formatRunStamp(run.started_at)} · ${formatDuration(run.duration_s)} · ${formatUsd(run.cost_usd)}`;
}

export function formatScoreDelta(delta: number | null): string {
  if (delta == null || !Number.isFinite(delta)) return "no data";
  if (delta === 0) return "0";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}`;
}

export function weekdayMonthDay(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  return `${WEEKDAYS[date.getUTCDay()]} ${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export function noData(): string {
  return "no data";
}
