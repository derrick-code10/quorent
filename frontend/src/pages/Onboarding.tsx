import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  PRESET_INTERESTS,
  TIMEZONES,
  MAX_INTERESTS,
  detectTimezone,
} from "../data/onboardingData";

const API_URL = import.meta.env.VITE_API_URL as string;

const inputClass =
  "w-full font-mono text-sm bg-background border-2 border-text-primary px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";

function InterestChip({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-mono text-xs uppercase tracking-wider px-4 py-2.5 border-2 border-text-primary transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        selected
          ? "bg-text-primary text-background"
          : "bg-background text-text-primary hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(36,36,34,1)]"
      } ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {label}
    </button>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [digestTime, setDigestTime] = useState("07:00");
  const [digestTimezone, setDigestTimezone] = useState(detectTimezone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate("/", { replace: true });
        return;
      }
      setToken(data.session.access_token);
    });
  }, [navigate]);

  function toggleInterest(interest: string) {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < MAX_INTERESTS
          ? [...prev, interest]
          : prev,
    );
  }

  function addCustom() {
    const trimmed = customInput.trim();
    if (
      !trimmed ||
      selected.includes(trimmed) ||
      selected.length >= MAX_INTERESTS
    )
      return;
    setSelected((prev) => [...prev, trimmed]);
    setCustomInput("");
  }

  async function handleSubmit() {
    if (!token || selected.length === 0 || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          interests: selected,
          preferred_digest_time: digestTime,
          preferred_digest_timezone: digestTimezone,
          onboarding_completed: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to save preferences.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  const atLimit = selected.length >= MAX_INTERESTS;
  const customSelections = selected.filter(
    (s) => !PRESET_INTERESTS.includes(s),
  );

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans antialiased">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(#242422 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <header className="border-b-4 border-text-primary bg-background relative z-10">
        <div className="max-w-3xl mx-auto px-8 py-5 flex items-end justify-between">
          <div>
            <h1
              className="font-serif font-bold uppercase leading-none"
              style={{
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                letterSpacing: "-0.02em",
              }}
            >
              Quorent
            </h1>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-accent mt-1">
              Daily Chronicle
            </p>
          </div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted pb-1">
            Est. {new Date().getFullYear()} · Personalized AI Intelligence
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-12 relative z-10">
        <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-secondary font-bold mb-5">
          Subscriber Setup · Step 1 of 1
        </p>

        <div className="h-1 bg-text-primary mb-8" />

        <div className="mb-8">
          <h2
            className="font-serif font-bold leading-none text-text-primary mb-3"
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              letterSpacing: "-0.025em",
            }}
          >
            What moves you?
          </h2>
          <p className="font-sans text-sm text-text-muted leading-relaxed max-w-lg">
            Choose up to {MAX_INTERESTS} topics. Your morning digest will be
            curated from thousands of sources around these interests.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {PRESET_INTERESTS.map((interest) => (
            <InterestChip
              key={interest}
              label={interest}
              selected={selected.includes(interest)}
              disabled={!selected.includes(interest) && atLimit}
              onClick={() => toggleInterest(interest)}
            />
          ))}
        </div>

        <Divider label="Or add your own" />

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="e.g. Quantum computing"
            maxLength={40}
            disabled={atLimit}
            className="flex-1 font-mono text-sm bg-background border-2 border-text-primary px-4 py-2.5 text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-40"
          />
          <button
            onClick={addCustom}
            disabled={
              !customInput.trim() ||
              selected.includes(customInput.trim()) ||
              atLimit
            }
            className="font-mono text-xs uppercase tracking-wider px-5 py-2.5 border-2 border-text-primary bg-background text-text-primary transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(36,36,34,1)] disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Add
          </button>
        </div>

        {customSelections.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {customSelections.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider px-3 py-2 bg-text-primary text-background"
              >
                {tag}
                <button
                  onClick={() => toggleInterest(tag)}
                  className="hover:opacity-60 transition-opacity focus:outline-none leading-none"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <Divider label="Delivery preferences" />

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-widest text-text-muted mb-2">
              Digest time
            </label>
            <input
              type="time"
              value={digestTime}
              onChange={(e) => setDigestTime(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-widest text-text-muted mb-2">
              Time zone
            </label>
            <div className="relative">
              <select
                value={digestTimezone}
                onChange={(e) => setDigestTimezone(e.target.value)}
                className={`${inputClass} appearance-none cursor-pointer pr-10`}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-text-muted">
                ▾
              </span>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-text-primary pt-6 flex items-center justify-between gap-6">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
              Topics selected
            </p>
            <p className="font-serif text-3xl font-bold text-text-primary leading-none mt-0.5">
              {selected.length}
              <span className="text-text-muted font-sans text-base font-normal">
                /{MAX_INTERESTS}
              </span>
            </p>
            {atLimit && (
              <p className="font-mono text-[9px] uppercase tracking-wider text-accent mt-1">
                Maximum reached
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {error && (
              <p className="font-mono text-[10px] text-red-600 uppercase tracking-wider">
                {error}
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={selected.length === 0 || loading || !token}
              className="flex items-center gap-3 bg-text-primary text-background font-sans font-bold text-sm py-3.5 px-8 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(134,197,134,1)]] active:translate-y-0 active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? "Saving…" : "Start My Digest"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="h-px flex-1 bg-text-primary/15" />
      <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted whitespace-nowrap">
        {label}
      </span>
      <div className="h-px flex-1 bg-text-primary/15" />
    </div>
  );
}
