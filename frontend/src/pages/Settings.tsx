import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { PRESET_INTERESTS, TIMEZONES, MAX_INTERESTS } from "../data/onboardingData";
import DotGrid from "../components/DotGrid";
import SectionLabel from "../components/SectionLabel";
import { TODAY } from "../lib/utils";

// ─── Shared input style ───────────────────────────────────────────────────────

const inputClass =
  "w-full font-mono text-sm bg-background border-2 border-text-primary px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";

// ─── Interest chip ────────────────────────────────────────────────────────────

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
      } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
    >
      {label}
    </button>
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

function CustomInterestInput({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: (value: string) => void;
}) {
  const [value, setValue] = useState("");

  function submit() {
    onAdd(value);
    setValue("");
  }

  return (
    <div className="flex gap-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="e.g. Quantum computing"
        maxLength={40}
        disabled={disabled}
        className="flex-1 font-mono text-sm bg-background border-2 border-text-primary px-4 py-2.5 text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-40"
      />
      <button
        onClick={submit}
        disabled={!value.trim() || disabled}
        className="font-mono text-xs uppercase tracking-wider px-5 py-2.5 border-2 border-text-primary bg-background text-text-primary transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(36,36,34,1)] disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Add
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Settings() {
  const navigate = useNavigate();
  const { user, form, loading, saveStatus, saveError, setForm, handleSave } = useSettings();

  const atLimit = form.interests.length >= MAX_INTERESTS;
  const customInterests = form.interests.filter((i) => !PRESET_INTERESTS.includes(i));

  function toggleInterest(interest: string) {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : atLimit
          ? prev.interests
          : [...prev.interests, interest],
    }));
  }

  function removeInterest(interest: string) {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  }

  function addCustomInterest(value: string) {
    const trimmed = value.trim();
    if (!trimmed || form.interests.includes(trimmed) || atLimit) return;
    setForm((prev) => ({ ...prev, interests: [...prev.interests, trimmed] }));
  }

  const saveLabel =
    saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved ✓" : "Save Changes";

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans antialiased">
      <DotGrid />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b-4 border-text-primary bg-background sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-8">
          <div className="flex items-center py-2">
            <div className="h-px flex-1 bg-text-primary" />
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] px-4 text-text-muted">
              Est. {new Date().getFullYear()} · Personalized AI Intelligence
            </span>
            <div className="h-px flex-1 bg-text-primary" />
          </div>

          <div className="flex items-end justify-between py-4">
            <div>
              <h1
                className="font-serif font-bold uppercase leading-none"
                style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", letterSpacing: "-0.025em" }}
              >
                Quorent
              </h1>
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-accent mt-1">
                Daily Chronicle
              </p>
            </div>

            <div className="flex items-center gap-5 pb-1">
              <div className="text-right hidden sm:block">
                <p className="font-mono text-[10px] text-text-muted">{TODAY}</p>
                {!loading && user && (
                  <p className="font-mono text-[10px] text-text-primary font-bold">
                    {user.full_name || user.email}
                  </p>
                )}
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                className="font-mono text-[10px] uppercase tracking-wider px-4 py-2 border-2 border-text-primary bg-background text-text-primary transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(36,36,34,1)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Dashboard
              </button>
            </div>
          </div>

        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-12 relative z-10">
        <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-secondary font-bold mb-5">
          Subscriber Preferences
        </p>
        <div className="h-1 bg-text-primary mb-8" />

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[100, 75, 90, 60].map((w, i) => (
              <div key={i} className="h-3 bg-text-primary/10 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {/* ── Account info (read-only) ─────────────────────────── */}
            <section>
              <SectionLabel color="bg-text-primary">Account</SectionLabel>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-1.5">
                    Name
                  </p>
                  <p className="font-sans text-sm text-text-primary">
                    {user?.full_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-1.5">
                    Email
                  </p>
                  <p className="font-sans text-sm text-text-primary">{user?.email}</p>
                </div>
              </div>
            </section>

            {/* ── Interests ─────────────────────────────────────────── */}
            <section>
              <SectionLabel color="bg-accent">Your Interests</SectionLabel>
              <p className="font-sans text-sm text-text-muted leading-relaxed mb-6">
                Choose up to {MAX_INTERESTS} topics. Your digest will be curated around these.
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {PRESET_INTERESTS.map((interest) => (
                  <InterestChip
                    key={interest}
                    label={interest}
                    selected={form.interests.includes(interest)}
                    disabled={!form.interests.includes(interest) && atLimit}
                    onClick={() => toggleInterest(interest)}
                  />
                ))}
              </div>

              <Divider label="Custom topics" />

              <CustomInterestInput disabled={atLimit} onAdd={addCustomInterest} />

              {customInterests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {customInterests.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider px-3 py-2 bg-text-primary text-background"
                    >
                      {tag}
                      <button
                        onClick={() => removeInterest(tag)}
                        className="hover:opacity-60 transition-opacity focus:outline-none leading-none"
                        aria-label={`Remove ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
                  {form.interests.length}/{MAX_INTERESTS} selected
                </span>
                {atLimit && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-accent">
                    · Maximum reached
                  </span>
                )}
              </div>
            </section>

            {/* ── Email digest ───────────────────────────────────────── */}
            <section>
              <SectionLabel color="bg-secondary">Email Digest</SectionLabel>

              {/* Toggle */}
              <div className="flex items-center justify-between border-2 border-text-primary px-4 py-3 mb-6">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-text-primary font-bold">
                    Daily briefing
                  </p>
                  <p className="font-sans text-xs text-text-muted mt-0.5">
                    Receive an AI-curated digest in your inbox every day
                  </p>
                </div>
                <div className="flex shrink-0 border-2 border-text-primary overflow-hidden">
                  <button
                    onClick={() => setForm((prev) => ({ ...prev, email_digest_enabled: true }))}
                    className={`font-mono text-[10px] uppercase tracking-wider px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${
                      form.email_digest_enabled
                        ? "bg-text-primary text-background"
                        : "bg-background text-text-muted hover:text-text-primary"
                    }`}
                  >
                    On
                  </button>
                  <div className="w-px bg-text-primary" />
                  <button
                    onClick={() => setForm((prev) => ({ ...prev, email_digest_enabled: false }))}
                    className={`font-mono text-[10px] uppercase tracking-wider px-4 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${
                      !form.email_digest_enabled
                        ? "bg-text-primary text-background"
                        : "bg-background text-text-muted hover:text-text-primary"
                    }`}
                  >
                    Off
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-widest text-text-muted mb-2">
                    Delivery time
                  </label>
                  <input
                    type="time"
                    value={form.preferred_digest_time}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, preferred_digest_time: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-widest text-text-muted mb-2">
                    Timezone
                  </label>
                  <div className="relative">
                    <select
                      value={form.preferred_digest_timezone}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          preferred_digest_timezone: e.target.value,
                        }))
                      }
                      className={`${inputClass} appearance-none pr-10`}
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
            </section>

            {/* ── Save bar ─────────────────────────────────────────── */}
            <div className="border-t-2 border-text-primary pt-6 flex items-center justify-between gap-6">
              <div>
                {saveError && (
                  <p className="font-mono text-[10px] uppercase tracking-wider text-red-600 max-w-xs leading-relaxed">
                    Could not save — {saveError.toLowerCase().replace(/^value error,\s*/i, "")}
                  </p>
                )}
                {saveStatus === "saved" && (
                  <p className="font-mono text-[10px] uppercase tracking-wider text-green-700">
                    Preferences saved.
                  </p>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={saveStatus === "saving" || form.interests.length === 0}
                className="flex items-center gap-3 bg-text-primary text-background font-sans font-bold text-sm py-3.5 px-8 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(129,103,41,1)] active:translate-y-0 active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {saveStatus === "saving" && (
                  <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                )}
                {saveLabel}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
