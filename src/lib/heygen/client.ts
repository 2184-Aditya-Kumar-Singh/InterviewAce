import "server-only";

export async function createHeyGenStreamingToken() {
  const apiKey =
    process.env.HEYGEN_API_KEY;

  if (!apiKey) {
    throw new Error(
      "HEYGEN_API_KEY is not configured."
    );
  }

  const response = await fetch(
    "https://api.heygen.com/v1/streaming.create_token",
    {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?.data?.message ||
      data?.data?.error;

    throw new Error(
      typeof message === "string"
        ? message
        :
        "Could not create HeyGen streaming token."
    );
  }

  const token =
    data?.data?.token ||
    data?.token;

  if (!token) {
    throw new Error(
      "HeyGen did not return a streaming token."
    );
  }

  return token as string;
}
