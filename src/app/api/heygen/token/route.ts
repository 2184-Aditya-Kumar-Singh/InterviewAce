import {
  NextResponse,
} from "next/server";

import { createHeyGenStreamingToken } from "@/lib/heygen/client";
import type {
  HeyGenApiError,
  HeyGenTokenResponse,
} from "@/lib/heygen/session";

export const runtime = "nodejs";

export async function POST() {
  try {
    const token =
      await createHeyGenStreamingToken();

    return NextResponse.json<HeyGenTokenResponse>(
      {
        token,
      }
    );
  } catch (error) {
    console.error(
      "HEYGEN TOKEN ERROR:",
      error
    );

    return NextResponse.json<HeyGenApiError>(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not start HeyGen avatar.",
      },
      {
        status: 500,
      }
    );
  }
}
