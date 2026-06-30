import {
  NextResponse,
} from "next/server";

import {
  createLiveAvatarSessionToken,
  LiveAvatarApiError,
} from "@/lib/heygen/client";
import type {
  HeyGenApiError,
  LiveAvatarTokenRequest,
  LiveAvatarTokenResponse,
} from "@/lib/heygen/session";

export const runtime = "nodejs";

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as Partial<LiveAvatarTokenRequest>;

    const sessionToken =
      await createLiveAvatarSessionToken(
        body.avatarId || ""
      );

    return NextResponse.json<LiveAvatarTokenResponse>(
      {
        sessionToken,
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
            : "Could not start LiveAvatar interviewer.",
      },
      {
        status:
          error instanceof LiveAvatarApiError
            ? error.status
            : 500,
      }
    );
  }
}
