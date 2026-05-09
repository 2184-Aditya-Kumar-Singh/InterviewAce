"use client";

import { supabase } from "./supabase";
import type { UserRole } from "./types";

export const ADMIN_EMAIL = "aditya.k.singhh@gmail.com";

export async function syncCurrentProfile(): Promise<{ role: UserRole; email?: string } | null> {
  if (!supabase) return { role: "admin", email: ADMIN_EMAIL };

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session) return null;

  const response = await fetch("/api/auth/profile", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (response.ok) {
    const data = await response.json();
    if (data.profile?.role) {
      if (data.profile.email?.toLowerCase() === ADMIN_EMAIL && typeof window !== "undefined") {
        window.localStorage.setItem("interviewace:plan", "PREMIUM");
      }
      return { role: data.profile.role, email: data.profile.email };
    }
  }

  const email = session.user.email;
  if (email?.toLowerCase() === ADMIN_EMAIL && typeof window !== "undefined") {
    window.localStorage.setItem("interviewace:plan", "PREMIUM");
  }
  return { role: email?.toLowerCase() === ADMIN_EMAIL ? "admin" : "user", email };
}
