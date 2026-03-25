import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getUser, updateUser } from "../lib/api";
import { detectTimezone } from "../data/onboardingData";
import type { UserProfile } from "../types/api";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SettingsForm {
  interests: string[];
  email_digest_enabled: boolean;
  preferred_digest_time: string;
  preferred_digest_timezone: string;
}

export interface UseSettingsReturn {
  token: string | null;
  user: UserProfile | null;
  form: SettingsForm;
  loading: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  setForm: React.Dispatch<React.SetStateAction<SettingsForm>>;
  handleSave: () => Promise<void>;
}

const DEFAULT_FORM: SettingsForm = {
  interests: [],
  email_digest_enabled: true,
  preferred_digest_time: "07:00",
  preferred_digest_timezone: detectTimezone(),
};

export function useSettings(): UseSettingsReturn {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<SettingsForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setToken(data.session.access_token);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    getUser(token)
      .then((u) => {
        setUser(u);
        setForm({
          interests: u.interests,
          email_digest_enabled: u.email_digest_enabled,
          preferred_digest_time: u.preferred_digest_time.slice(0, 5),
          preferred_digest_timezone: u.preferred_digest_timezone,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave() {
    if (!token || saveStatus === "saving") return;
    setSaveStatus("saving");
    setSaveError(null);
    try {
      const updated = await updateUser(token, {
        ...form,
        preferred_digest_time: form.preferred_digest_time.slice(0, 5),
      });
      setUser(updated);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed.");
      setSaveStatus("error");
    }
  }

  return {
    token,
    user,
    form,
    loading,
    saveStatus,
    saveError,
    setForm,
    handleSave,
  };
}
