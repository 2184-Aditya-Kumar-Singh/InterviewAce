import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdmin, isSupabaseAdminConfigured } from "./supabase-admin";

export const DEFAULT_ADMIN_EMAIL = "aditya.k.singhh@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isDefaultAdminEmail(email?: string | null) {
  return email?.toLowerCase() === DEFAULT_ADMIN_EMAIL;
}

export async function getUserFromRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !supabaseUrl || !supabasePublicKey) return null;

  const client = createClient(supabaseUrl, supabasePublicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function upsertProfileForAuthUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
  if (!isSupabaseAdminConfigured) return null;

  const admin = createSupabaseAdmin();
  const email = user.email?.toLowerCase() || "";
  const role = isDefaultAdminEmail(email) ? "admin" : "user";
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null;
  const avatarUrl = typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  const { data, error } = await admin
    .from("users")
    .upsert(
      {
        id: user.id,
        email,
        full_name: fullName,
        avatar_url: avatarUrl,
        role,
      },
      { onConflict: "id" },
    )
    .select("id,email,role,full_name,avatar_url")
    .single();

  if (error) throw error;
  if (role === "admin") {
    const { data: existingSubscription, error: lookupError } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (lookupError) throw lookupError;

    const subscriptionPayload = { user_id: user.id, plan: "PREMIUM", status: "active", expires_at: null };
    const { error: subscriptionError } = existingSubscription
      ? await admin.from("subscriptions").update(subscriptionPayload).eq("id", existingSubscription.id)
      : await admin.from("subscriptions").insert(subscriptionPayload);
    if (subscriptionError) throw subscriptionError;
  }
  return data;
}

export async function assertAdmin(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user?.email) return { ok: false as const, status: 401, error: "Unauthorized" };
  if (isDefaultAdminEmail(user.email)) {
    const profile = await upsertProfileForAuthUser(user);
    return { ok: true as const, user, profile };
  }

  if (!isSupabaseAdminConfigured) return { ok: false as const, status: 403, error: "Forbidden" };
  const admin = createSupabaseAdmin();
  const { data } = await admin.from("users").select("role").eq("id", user.id).maybeSingle();
  if (data?.role === "admin") return { ok: true as const, user, profile: data };

  return { ok: false as const, status: 403, error: "Forbidden" };
}
