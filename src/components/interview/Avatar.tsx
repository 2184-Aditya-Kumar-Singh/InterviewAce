"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  Loader2,
  Video,
} from "lucide-react";

import type {
  AvatarState,
} from "@/hooks/useAvatar";
import type {
  HeyGenAvatarProfile,
} from "@/lib/heygen/avatar";

export function Avatar({
  state,
  error,
  profile,
  onVideoReady,
}: {
  state: AvatarState;
  error?: string;
  profile: HeyGenAvatarProfile;
  onVideoReady: (
    element: HTMLVideoElement | null
  ) => void;
}) {
  const videoRef =
    useRef<HTMLVideoElement | null>(
      null
    );

  useEffect(() => {
    onVideoReady(videoRef.current);

    return () =>
      onVideoReady(null);
  }, [onVideoReady]);

  const connecting =
    state === "CONNECTING" ||
    state === "IDLE";

  return (
    <section className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div className="relative aspect-video min-h-[380px] bg-[radial-gradient(circle_at_50%_25%,#123e48,#020617_70%)]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`h-full w-full bg-black object-contain ${
            state === "READY" ||
            state ===
              "AVATAR_SPEAKING"
              ? "block"
              : "hidden"
          }`}
        />

        {state === "READY" ||
        state ===
          "AVATAR_SPEAKING" ? null : (
          <div className="grid h-full min-h-[380px] place-items-center px-6 text-center sm:px-8">
            <div className="max-w-md">
              <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-white/10 bg-white/5 text-emerald-300">
                {connecting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Video />
                )}
              </div>
              <h2 className="mt-5 text-2xl font-black leading-tight">
                {connecting
                  ? "Connecting interviewer..."
                  : "Avatar unavailable"}
              </h2>
              <p className="mt-3 break-words text-sm leading-6 text-slate-400">
                {error ||
                  "The live interviewer will appear here when the HeyGen session is ready."}
              </p>
            </div>
          </div>
        )}

        {state === "AVATAR_SPEAKING" && (
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-emerald-400/20 to-transparent" />
        )}
      </div>

      <div className="border-t border-white/10 bg-slate-950 p-5">
        <p className="text-xs font-semibold uppercase text-emerald-300">
          {profile.label}
        </p>
        <h3 className="mt-1 text-xl font-black">
          Live AI Interviewer
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          {profile.subtitle}
        </p>
      </div>
    </section>
  );
}
