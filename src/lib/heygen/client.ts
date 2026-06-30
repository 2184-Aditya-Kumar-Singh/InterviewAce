import "server-only";

const liveAvatarApiUrl =
  "https://api.liveavatar.com";

const defaultMaxSessionDurationSeconds =
  600;

type LiveAvatarTokenApiResponse = {
  code?: number;
  data?: {
    session_token?: string;
    session_id?: string;
  };
  message?: string;
  error?: {
    code?: string | number;
    message?: string;
  };
};

export class LiveAvatarApiError extends Error {
  status: number;

  constructor(
    message: string,
    status = 500
  ) {
    super(message);
    this.name = "LiveAvatarApiError";
    this.status = status;
  }
}

function readLiveAvatarMessage(
  data: LiveAvatarTokenApiResponse
) {
  return (
    data.message ||
    data.error?.message ||
    "Could not create LiveAvatar session token."
  );
}

export async function createLiveAvatarSessionToken(
  avatarId: string
) {
  const apiKey =
    process.env.LIVEAVATAR_API_KEY ||
    process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    throw new Error(
      "LIVEAVATAR_API_KEY or HEYGEN_API_KEY is not configured."
    );
  }

  if (
    !avatarId ||
    avatarId === "default"
  ) {
    throw new Error(
      "LiveAvatar avatar ID is not configured."
    );
  }

  const response = await fetch(
    `${liveAvatarApiUrl}/v1/sessions/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        avatar_id: avatarId,
        avatar_persona: {
          language: "en",
        },
        mode: "FULL",
        interactivity_type:
          "CONVERSATIONAL",
        is_sandbox: false,
        max_session_duration:
          Number(
            process.env.LIVEAVATAR_MAX_SESSION_DURATION_SECONDS
          ) ||
          defaultMaxSessionDurationSeconds,
        video_settings: {
          quality: "high",
          encoding: "H264",
        },
      }),
      cache: "no-store",
    }
  );

  const data =
    (await response.json()) as LiveAvatarTokenApiResponse;

  if (!response.ok) {
    throw new LiveAvatarApiError(
      readLiveAvatarMessage(data),
      response.status
    );
  }

  const sessionToken =
    data.data?.session_token;

  if (!sessionToken) {
    throw new Error(
      readLiveAvatarMessage(data)
    );
  }

  return sessionToken;
}
