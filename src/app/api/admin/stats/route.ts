import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin";
import { createSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const adminCheck = await assertAdmin(request);
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  if (!isSupabaseAdminConfigured) {
    return NextResponse.json({
      stats: {
        totalUsers: 0,
        paidUsers: 0,
        freeUsers: 0,
        interviewsCompleted: 0,
        revenue: "₹0",
        conversionRate: "0%",
        feedbackReports: 0,
        supportMessages: 0,
        activeSubscriptions: 0,
      },
    });
  }

  const supabase = createSupabaseAdmin();
  const [users, paid, free, interviews, activeSubscriptions, reports] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).in("plan", ["PRO", "PREMIUM"]),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("plan", "FREE"),
    supabase.from("interviews").select("id", { count: "exact", head: true }).not("ended_at", "is", null),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("reports").select("id", { count: "exact", head: true }),
  ]);

  const totalUsers = users.count || 0;
  const paidUsers = paid.count || 0;

  return NextResponse.json({
    stats: {
      totalUsers,
      paidUsers,
      freeUsers: free.count || Math.max(0, totalUsers - paidUsers),
      interviewsCompleted: interviews.count || 0,
      revenue: "₹0",
      conversionRate: totalUsers ? `${Math.round((paidUsers / totalUsers) * 100)}%` : "0%",
      feedbackReports: reports.count || 0,
      supportMessages: 0,
      activeSubscriptions: activeSubscriptions.count || 0,
    },
  });
}
