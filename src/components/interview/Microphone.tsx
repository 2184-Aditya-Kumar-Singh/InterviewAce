"use client";

import {
  Mic,
  MicOff,
} from "lucide-react";

export function Microphone({
  listening,
  disabled,
  onClick,
}: {
  listening: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
        listening
          ? "bg-rose-400 text-slate-950"
          : "bg-sky-400 text-slate-950 hover:scale-[1.02]"
      }`}
    >
      {listening ? (
        <MicOff size={18} />
      ) : (
        <Mic size={18} />
      )}
      {listening
        ? "Stop Listening"
        : "Answer with Voice"}
    </button>
  );
}
