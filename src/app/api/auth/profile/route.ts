import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getUserFromRequest,
  upsertProfileForAuthUser,
} from "@/lib/admin";

export async function POST(
  request: NextRequest
) {
  const user =
    await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const profile =
      await upsertProfileForAuthUser(
        user
      );

    return NextResponse.json({
      profile,
    });
  } catch (err: unknown) {
    console.error(
      "PROFILE API ERROR:",
      err
    );

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not sync profile.",
      },
      { status: 500 }
    );
  }
}
