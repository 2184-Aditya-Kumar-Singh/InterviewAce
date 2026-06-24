"use client";

export type InterviewStatus =
  | "IDLE"
  | "LISTENING"
  | "PROCESSING"
  | "AVATAR_SPEAKING"
  | "WAITING_FOR_USER"
  | "ERROR";

const labels: Record<
  InterviewStatus,
  string
> = {
  IDLE: "Idle",
  LISTENING: "Listening...",
  PROCESSING: "Thinking...",
  AVATAR_SPEAKING:
    "Interviewer Speaking...",
  WAITING_FOR_USER:
    "Waiting for Answer...",
  ERROR: "Needs Attention",
};

export function StatusIndicator({
  status,
}: {
  status: InterviewStatus;
}) {
  const active =
    status === "LISTENING" ||
    status === "PROCESSING" ||
    status === "AVATAR_SPEAKING";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          status === "ERROR"
            ? "bg-rose-400"
            : active
            ? "animate-pulse bg-emerald-400"
            : "bg-slate-500"
        }`}
      />
      {labels[status]}
    </div>
  );
}
