import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin";
import {
  createSupabaseAdmin,
  isSupabaseAdminConfigured,
} from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const adminCheck = await assertAdmin(request);

  if (!adminCheck.ok) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
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

  try {
    const supabase = createSupabaseAdmin();

    // Fetch platform stats
    const [users, interviews, reports] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("interviews")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("reports")
          .select("id", {
            count: "exact",
            head: true,
          }),
      ]);

    // Handle query errors
    if (
      users.error ||
      interviews.error ||
      reports.error
    ) {
      console.error({
        usersError: users.error,
        interviewsError: interviews.error,
        reportsError: reports.error,
      });

      return NextResponse.json(
        { error: "Failed loading admin stats" },
        { status: 500 }
      );
    }

    const totalUsers = users.count || 0;

    return NextResponse.json({
      stats: {
        totalUsers,
        paidUsers: 0,
        freeUsers: totalUsers,
        interviewsCompleted:
          interviews.count || 0,
        revenue: "₹0",
        conversionRate: "0%",
        feedbackReports: reports.count || 0,
        supportMessages: 0,
        activeSubscriptions: 0,
      },
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
