import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";

type AuthState = "loading" | "authenticated" | "unauthenticated";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <p className="font-serif text-2xl font-bold uppercase tracking-tight text-text-primary">
        Quorent
      </p>
      <span className="w-5 h-5 border-2 border-text-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ProtectedRoute() {
  const [state, setState] = useState<AuthState>("loading");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState(data.session ? "authenticated" : "unauthenticated");
    });
  }, []);

  if (state === "loading") return <LoadingScreen />;
  if (state === "unauthenticated") return <Navigate to="/" replace />;
  return <Outlet />;
}
