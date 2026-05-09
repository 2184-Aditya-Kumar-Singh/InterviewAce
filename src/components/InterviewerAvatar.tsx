"use client";

import Image from "next/image";
import { Mic, PhoneOff, Volume2, Wand2 } from "lucide-react";
import type { InterviewPersona } from "@/lib/types";

const personaCopy: Record<InterviewPersona, { tone: string; badge: string }> = {
  "Friendly HR": {
    tone: "Warm, encouraging, behavioral",
    badge: "HR",
  },
  "Strict Technical Lead": {
    tone: "Precise, deep, technical",
    badge: "TL",
  },
  "Corporate Manager": {
    tone: "Structured, business-focused",
    badge: "CM",
  },
};

export function InterviewerAvatar({
  persona,
  speaking,
  listening = false,
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
  const details = personaCopy[persona];

  if (variant === "call") {
    return (
      <div className="overflow-hidden rounded-lg border border-white/10 bg-black">
        <div className="relative grid min-h-[360px] place-items-center bg-[radial-gradient(circle_at_center,#164e63_0,#020617_62%)] p-6">
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-xs text-slate-200 backdrop-blur">
            <span className={`h-2 w-2 rounded-full ${speaking ? "bg-emerald-300" : listening ? "bg-sky-300" : "bg-slate-500"}`} />
            {speaking ? "Interviewer speaking" : listening ? "Listening to you" : "Live interview"}
          </div>
          <div
            className={`relative h-64 w-64 overflow-hidden rounded-lg border border-emerald-200/25 bg-slate-900 shadow-2xl shadow-emerald-950/40 ${
              speaking ? "animate-[human_speak_1.8s_ease-in-out_infinite]" : listening ? "animate-[human_listen_2.4s_ease-in-out_infinite]" : ""
            }`}
          >
            <Image src="/avatar-professional.svg" alt={`${persona} interviewer avatar`} fill priority className="object-cover" />
            <span
              className={`absolute bottom-12 left-9 h-20 w-5 origin-top rounded-full bg-slate-800/80 ${
                speaking ? "animate-[left_hand_900ms_ease-in-out_infinite]" : listening ? "animate-[listen_hand_1.6s_ease-in-out_infinite]" : ""
              }`}
            />
            <span
              className={`absolute bottom-12 right-9 h-20 w-5 origin-top rounded-full bg-slate-800/80 ${
                speaking ? "animate-[right_hand_900ms_ease-in-out_infinite]" : listening ? "animate-[listen_hand_1.6s_ease-in-out_infinite]" : ""
              }`}
            />
            <span
              className={`absolute bottom-[58px] left-1/2 h-3 w-16 -translate-x-1/2 rounded-full bg-slate-800 transition ${
                speaking ? "animate-[talk_420ms_ease-in-out_infinite] bg-emerald-500" : ""
              }`}
            />
            {(speaking || listening) && (
              <span className={`absolute inset-0 animate-pulse rounded-lg ring-4 ${speaking ? "ring-emerald-300/40" : "ring-sky-300/35"}`} />
            )}
          </div>
          <div className="absolute bottom-4 flex items-center gap-3 rounded-full bg-black/55 px-4 py-3 backdrop-blur">
            <button
              onClick={onToggleTts}
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-950 hover:bg-slate-100"
              aria-label={ttsEnabled ? "Turn browser voice off" : "Turn browser voice on"}
              title={ttsEnabled ? "Voice on" : "Voice off"}
            >
              {ttsEnabled ? <Volume2 size={18} /> : <Mic size={18} />}
            </button>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-rose-500 text-white" title="End from interview controls">
              <PhoneOff size={18} />
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-white/10 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-xs font-bold text-slate-950">{details.badge}</span>
              <p className="font-semibold">{persona}</p>
            </div>
            <p className="mt-1 text-sm text-slate-300">{details.tone}</p>
          </div>
          <p className="text-sm text-slate-400">Premium voice-only mode</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-emerald-300/30 bg-slate-900">
          <Image
            src="/avatar-professional.svg"
            alt={`${persona} interviewer avatar`}
            fill
            priority
            className={`object-cover ${listening ? "animate-[human_listen_2.4s_ease-in-out_infinite]" : ""}`}
          />
          <span
            className={`absolute bottom-[22px] left-1/2 h-2 w-7 -translate-x-1/2 rounded-full bg-slate-800 transition ${
              speaking ? "animate-[talk_420ms_ease-in-out_infinite] bg-emerald-500" : ""
            }`}
          />
          {speaking && <span className="absolute inset-0 animate-pulse rounded-lg ring-2 ring-emerald-300/50" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-xs font-bold text-slate-950">{details.badge}</span>
            <p className="truncate font-semibold">{persona}</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{details.tone}</p>
          <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            <Wand2 size={14} />
            SadTalker-style fallback uses local face animation when video generation is unavailable.
          </p>
        </div>
      </div>
      <button
        onClick={onToggleTts}
        className="focus-ring mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
      >
        {ttsEnabled ? <Volume2 size={16} /> : <Mic size={16} />}
        {ttsEnabled ? "Browser voice on" : "Browser voice off"}
      </button>
    </div>
  );
}
