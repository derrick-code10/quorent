import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

const API_URL = import.meta.env.VITE_API_URL as string;

export default function AuthCallback() {
  const navigate = useNavigate();
  const resolved = useRef(false);

  useEffect(() => {
    async function routeUser(session: Session) {
      if (resolved.current) return;
      resolved.current = true;

      try {
        const res = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) {
          navigate("/onboarding", { replace: true });
          return;
        }

        const user = await res.json();
        navigate(user.onboarding_completed ? "/dashboard" : "/onboarding", {
          replace: true,
        });
      } catch (err) {
        console.error("Callback error:", err);
        navigate("/onboarding", { replace: true });
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        routeUser(session);
      }

      if (event === "INITIAL_SESSION" && session) {
        routeUser(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <span className="w-8 h-8 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Signing you in…
        </p>
      </div>
    </div>
  );
}
