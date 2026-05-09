"use client";

import Image from "next/image";

import {
  Mic,
  Volume2,
} from "lucide-react";

import type {
  InterviewPersona,
} from "@/lib/types";

const personaMeta: Record<
  InterviewPersona,
  {
    subtitle: string;

    badge: string;
  }
> = {
  "Friendly HR": {
    subtitle:
      "Friendly behavioral interviewer",

    badge: "HR",
  },

  "Strict Technical Lead":
    {
      subtitle:
        "Deep technical interviewer",

      badge: "TL",
    },

  "Senior Engineering Manager":
    {
      subtitle:
        "Engineering leadership interviewer",

      badge: "EM",
    },

  "Corporate VP": {
    subtitle:
      "Executive business interviewer",

    badge: "VP",
  },
};

export function InterviewerAvatar({
  persona,

  speaking,

  listening,

  ttsEnabled,

  onToggleTts,

  variant = "compact",
}: {
  persona: InterviewPersona;

  speaking: boolean;

  listening?: boolean;

  ttsEnabled: boolean;

  onToggleTts: () => void;

  variant?: "compact" | "call";
}) {
  const meta =
    personaMeta[persona];

  return (
    <div
      className={`overflow-hidden rounded-3xl border border-white/10 ${
        variant === "call"
          ? "bg-black"
          : "bg-slate-950/70"
      }`}
    >
      {/* VIDEO AREA */}
      <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,#164e63_0,#020617_70%)]">
        {/* STATUS */}
        <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              speaking
                ? "bg-emerald-400"
                : listening
                ? "bg-sky-400"
                : "bg-slate-500"
            }`}
          />

          {speaking
            ? "AI Speaking"
            : listening
            ? "Listening"
            : "Ready"}
        </div>

        {/* AVATAR */}
        <div
          className={`relative h-72 w-72 overflow-hidden rounded-full border border-white/10 bg-slate-900 shadow-2xl transition-all duration-300 ${
            speaking
              ? "scale-[1.03]"
              : ""
          }`}
        >
          <Image
            src="/avatar-professional.svg"
            alt="AI Interviewer"
            fill
            priority
            className={`object-cover transition-all duration-300 ${
              speaking
                ? "animate-pulse"
                : ""
            }`}
          />

          {/* SPEAKING EFFECT */}
          {speaking && (
            <>
              <div className="absolute inset-0 animate-ping rounded-full border border-emerald-300/40" />

              <div className="absolute inset-0 rounded-full ring-4 ring-emerald-400/30" />
            </>
          )}
        </div>

        {/* VOICE BUTTON */}
        <button
          onClick={
            onToggleTts
          }
          className="absolute bottom-6 right-6 grid h-14 w-14 place-items-center rounded-full bg-white text-slate-950 shadow-lg transition hover:scale-105"
        >
          {ttsEnabled ? (
            <Volume2
              size={22}
            />
          ) : (
            <Mic size={22} />
          )}
        </button>
      </div>

      {/* INFO */}
      <div className="border-t border-white/10 p-6">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-emerald-400 px-3 py-1 text-sm font-black text-slate-950">
            {meta.badge}
          </span>

          <div>
            <h2 className="text-2xl font-black">
              {persona}
            </h2>

            <p className="text-sm text-slate-400">
              {
                meta.subtitle
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
