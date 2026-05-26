"use client";

import {
  Mic,
  Volume2,
  VolumeX,
} from "lucide-react";

import type {
  InterviewPersona,
  InterviewRound,
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
      "Behavioral and communication interviewer",
    badge: "HR",
  },
  "Strict Technical Lead": {
    subtitle:
      "Deep technical evaluation",
    badge: "TL",
  },
  "Senior Engineering Manager": {
    subtitle:
      "Architecture, ownership, and delivery",
    badge: "EM",
  },
  "Corporate VP": {
    subtitle:
      "Business impact and executive judgment",
    badge: "VP",
  },
};

const roundTheme: Record<
  InterviewRound,
  {
    label: string;
    suit: string;
    tie: string;
    hair: string;
    glow: string;
    bg: string;
  }
> = {
  HR: {
    label: "HR Interviewer",
    suit: "bg-emerald-900",
    tie: "bg-emerald-400",
    hair: "bg-[#4b2c20]",
    glow:
      "shadow-[0_0_120px_rgba(16,185,129,0.25)]",
    bg: "bg-[radial-gradient(circle_at_40%_25%,#1e3a35,#020617_68%)]",
  },
  Technical: {
    label: "Technical Interviewer",
    suit: "bg-slate-800",
    tie: "bg-sky-400",
    hair: "bg-[#111827]",
    glow:
      "shadow-[0_0_120px_rgba(56,189,248,0.24)]",
    bg: "bg-[radial-gradient(circle_at_40%_25%,#0f2f4a,#020617_68%)]",
  },
  Mixed: {
    label: "Mixed Interviewer",
    suit: "bg-indigo-950",
    tie: "bg-violet-400",
    hair: "bg-[#2d1b4e]",
    glow:
      "shadow-[0_0_120px_rgba(167,139,250,0.24)]",
    bg: "bg-[radial-gradient(circle_at_40%_25%,#2f254c,#020617_68%)]",
  },
};

export function InterviewerAvatar({
  persona,
  round,
  speaking,
  listening,
  ttsEnabled,
  onToggleTts,
  onStartListening,
  variant = "compact",
}: {
  persona: InterviewPersona;
  round: InterviewRound;
  speaking: boolean;
  listening?: boolean;
  ttsEnabled: boolean;
  onToggleTts: () => void;
  onStartListening?: () => void;
  variant?: "compact" | "call";
}) {
  const meta =
    personaMeta[persona];

  const theme =
    roundTheme[round];

  const premiumMode =
    variant === "call";

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div
        className={`relative flex min-h-[360px] items-center justify-center overflow-hidden ${theme.bg}`}
      >
        <div className="absolute left-5 top-5 z-20 flex items-center gap-3 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-xl">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              speaking
                ? "animate-pulse bg-emerald-400"
                : listening
                ? "animate-pulse bg-sky-400"
                : "bg-slate-500"
            }`}
          />
          {speaking
            ? "Speaking"
            : listening
            ? "Listening"
            : "Ready"}
        </div>

        {premiumMode && (
          <div className="absolute right-5 top-5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
            Premium Live Interview
          </div>
        )}

        <div
          className={`relative mt-4 h-[300px] w-[300px] rounded-[44px] bg-slate-100/95 ${theme.glow} ${
            speaking
              ? "animate-[avatarTalk_1.8s_ease-in-out_infinite]"
              : ""
          }`}
        >
          <div className="absolute inset-x-10 top-6 h-24 rounded-t-full bg-slate-900/10 blur-xl" />

          <div className="absolute left-1/2 top-14 h-40 w-36 -translate-x-1/2 rounded-[48%] bg-[#f3c6a6] shadow-inner">
            <div
              className={`absolute -left-3 -top-3 h-20 w-32 rounded-br-[80px] rounded-tl-[80px] ${theme.hair}`}
            />
            <div
              className={`absolute right-0 top-0 h-20 w-20 rounded-bl-[70px] rounded-tr-[70px] ${theme.hair}`}
            />
            <div className="absolute left-9 top-20 h-3 w-3 rounded-full bg-slate-950" />
            <div className="absolute right-9 top-20 h-3 w-3 rounded-full bg-slate-950" />
            <div className="absolute left-1/2 top-28 h-7 w-4 -translate-x-1/2 rounded-full border-r-2 border-[#d49b7b]" />
            <div
              className={`absolute left-1/2 top-36 -translate-x-1/2 rounded-full bg-[#7f3f32] ${
                speaking
                  ? "h-4 w-10 animate-[mouthTalk_.35s_ease-in-out_infinite]"
                  : "h-1.5 w-10"
              }`}
            />
          </div>

          <div
            className={`absolute bottom-0 left-1/2 h-28 w-44 -translate-x-1/2 rounded-t-[70px] ${theme.suit}`}
          />
          <div className="absolute bottom-20 left-1/2 h-16 w-24 -translate-x-1/2 rotate-45 bg-white" />
          <div className="absolute bottom-4 left-1/2 h-24 w-8 -translate-x-1/2 rounded-full bg-white" />
          <div
            className={`absolute bottom-2 left-1/2 h-24 w-6 -translate-x-1/2 rounded-full ${theme.tie}`}
          />

          {speaking && (
            <div className="absolute inset-[-14px] rounded-[54px] border border-emerald-300/40" />
          )}
        </div>

        <div className="absolute bottom-5 flex items-center gap-4">
          <button
            onClick={onToggleTts}
            className="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-950 shadow-lg transition hover:scale-105"
            title={
              ttsEnabled
                ? "Mute interviewer"
                : "Enable interviewer voice"
            }
          >
            {ttsEnabled ? (
              <Volume2 size={21} />
            ) : (
              <VolumeX size={21} />
            )}
          </button>

          {premiumMode && (
            <button
              onClick={onStartListening}
              className={`grid h-14 w-14 place-items-center rounded-full text-white shadow-2xl transition ${
                listening
                  ? "animate-pulse bg-emerald-500"
                  : "bg-sky-500 hover:scale-105"
              }`}
              title="Answer with voice"
            >
              <Mic size={25} />
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 bg-slate-950 p-5">
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-slate-950">
            {meta.badge}
          </span>
          <div>
            <h2 className="text-xl font-black">
              {persona}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {theme.label} - {meta.subtitle}
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes mouthTalk {
          0%,
          100% {
            height: 5px;
            border-radius: 999px;
          }
          50% {
            height: 18px;
            border-radius: 45%;
          }
        }

        @keyframes avatarTalk {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
}
