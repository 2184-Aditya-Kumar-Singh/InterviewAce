"use client";

import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneCall,
} from "lucide-react";

import type {
  InterviewPlan,
} from "@/lib/types";

type Props = {
  plan: InterviewPlan;

  listening: boolean;

  speaking: boolean;

  voiceEnabled: boolean;

  onToggleMic: () => void;

  onToggleVoice: () => void;
};

export function VoiceControls({
  plan,

  listening,

  speaking,

  voiceEnabled,

  onToggleMic,

  onToggleVoice,
}: Props) {
  if (plan === "FREE") {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            Voice Controls
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {plan ===
            "PREMIUM"
              ? "Realtime AI Call"
              : "Speech Interview"}
          </h2>
        </div>

        <div className="rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
          {plan}
        </div>
      </div>

      {/* STATUS */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatusCard
          title="Microphone"
          active={listening}
          activeText="Listening"
          inactiveText="Muted"
        />

        <StatusCard
          title="AI Voice"
          active={speaking}
          activeText="Speaking"
          inactiveText="Silent"
        />

        <StatusCard
          title="Realtime"
          active={
            plan ===
            "PREMIUM"
          }
          activeText="Enabled"
          inactiveText="Disabled"
        />
      </div>

      {/* CONTROLS */}
      <div className="mt-8 flex flex-wrap gap-4">
        <button
          onClick={
            onToggleMic
          }
          className={`flex items-center gap-3 rounded-xl px-6 py-4 font-bold transition ${
            listening
              ? "bg-rose-500 text-white"
              : "bg-white text-slate-950"
          }`}
        >
          {listening ? (
            <MicOff
              size={20}
            />
          ) : (
            <Mic size={20} />
          )}

          {listening
            ? "Mute Mic"
            : "Enable Mic"}
        </button>

        <button
          onClick={
            onToggleVoice
          }
          className={`flex items-center gap-3 rounded-xl px-6 py-4 font-bold transition ${
            voiceEnabled
              ? "bg-emerald-400 text-slate-950"
              : "bg-white text-slate-950"
          }`}
        >
          {voiceEnabled ? (
            <Volume2
              size={20}
            />
          ) : (
            <VolumeX
              size={20}
            />
          )}

          {voiceEnabled
            ? "Disable AI Voice"
            : "Enable AI Voice"}
        </button>

        {plan ===
          "PREMIUM" && (
          <button className="flex items-center gap-3 rounded-xl bg-sky-500 px-6 py-4 font-bold text-white">
            <PhoneCall
              size={20}
            />
            Live Call Active
          </button>
        )}
      </div>

      {/* INFO */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-sm text-slate-300">
        {plan === "PRO" && (
          <p>
            PRO plan enables
            speech-to-text
            interview answering.
          </p>
        )}

        {plan ===
          "PREMIUM" && (
          <p>
            PREMIUM plan enables
            realtime AI voice
            interviewer with
            recruiter-grade
            analysis.
          </p>
        )}
      </div>
    </div>
  );
}

function StatusCard({
  title,

  active,

  activeText,

  inactiveText,
}: {
  title: string;

  active: boolean;

  activeText: string;

  inactiveText: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <div className="mt-4 flex items-center gap-3">
        <span
          className={`h-3 w-3 rounded-full ${
            active
              ? "bg-emerald-400"
              : "bg-slate-500"
          }`}
        />

        <p className="font-semibold">
          {active
            ? activeText
            : inactiveText}
        </p>
      </div>
    </div>
  );
}
