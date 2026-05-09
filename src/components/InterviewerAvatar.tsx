"use client";

import Image from "next/image";

import {
  Mic,
  Volume2,
  VolumeX,
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
      "Behavioral & communication interviewer",

    badge: "HR",
  },

  "Strict Technical Lead":
    {
      subtitle:
        "Deep technical evaluation",

      badge: "TL",
    },

  "Senior Engineering Manager":
    {
      subtitle:
        "Leadership & engineering evaluation",

      badge: "EM",
    },

  "Corporate VP": {
    subtitle:
      "Executive-level business evaluation",

    badge: "VP",
  },
};

export function InterviewerAvatar({
  persona,

  speaking,

  listening,

  ttsEnabled,

  onToggleTts,

  onStartListening,

  variant = "compact",
}: {
  persona: InterviewPersona;

  speaking: boolean;

  listening?: boolean;

  ttsEnabled: boolean;

  onToggleTts: () => void;

  onStartListening?: () => void;

  variant?: "compact" | "call";
}) {
  const meta =
    personaMeta[persona];

  const premiumMode =
    variant === "call";

  return (
    <div
      className={`overflow-hidden rounded-3xl border border-white/10 ${
        premiumMode
          ? "bg-black"
          : "bg-slate-950/70"
      }`}
    >
      {/* VIDEO SECTION */}
      <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,#164e63_0,#020617_70%)]">
        {/* STATUS */}
        <div className="absolute left-5 top-5 z-20 flex items-center gap-3 rounded-full bg-black/60 px-5 py-2 text-sm text-white backdrop-blur-xl">
          <span
            className={`h-3 w-3 rounded-full ${
              speaking
                ? "animate-pulse bg-emerald-400"
                : listening
                ? "animate-pulse bg-sky-400"
                : "bg-slate-500"
            }`}
          />

          {speaking
            ? "AI Speaking"
            : listening
            ? "Listening..."
            : "Ready"}
        </div>

        {/* AVATAR */}
        <div
          className={`relative h-72 w-72 overflow-hidden rounded-full border border-white/10 bg-slate-900 shadow-[0_0_120px_rgba(16,185,129,0.15)] transition-all duration-300 ${
            speaking
              ? "scale-[1.04]"
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

          {/* GLOW */}
          {speaking && (
            <>
              <div className="absolute inset-0 animate-ping rounded-full border border-emerald-300/30" />

              <div className="absolute inset-0 rounded-full ring-4 ring-emerald-400/20" />
            </>
          )}
        </div>

        {/* CONTROLS */}
        <div className="absolute bottom-6 flex items-center gap-4">
          {/* SPEAKER BUTTON */}
          <button
            onClick={
              onToggleTts
            }
            className="grid h-14 w-14 place-items-center rounded-full bg-white text-slate-950 shadow-lg transition hover:scale-105"
          >
            {ttsEnabled ? (
              <Volume2
                size={22}
              />
            ) : (
              <VolumeX
                size={22}
              />
            )}
          </button>

          {/* MIC ONLY PREMIUM */}
          {premiumMode && (
            <button
              onClick={
                onStartListening
              }
              className={`grid h-16 w-16 place-items-center rounded-full text-white shadow-2xl transition ${
                listening
                  ? "animate-pulse bg-emerald-500"
                  : "bg-sky-500 hover:scale-105"
              }`}
            >
              <Mic
                size={28}
              />
            </button>
          )}
        </div>

        {/* PREMIUM LABEL */}
        {premiumMode && (
          <div className="absolute right-5 top-5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
            Premium Live Interview
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="border-t border-white/10 p-6">
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-emerald-400 px-4 py-1.5 text-sm font-black text-slate-950">
            {meta.badge}
          </span>

          <div>
            <h2 className="text-2xl font-black">
              {persona}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
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
