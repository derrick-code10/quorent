import type { Digest } from "../types/api";

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export const TODAY = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export const DIGEST_STATUS_STYLES: Record<Digest["status"], string> = {
  sent: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  queued: "bg-amber-100 text-amber-800",
};
