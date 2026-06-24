"use client";

export type TranscriptItem = {
  id: string;
  speaker: "interviewer" | "candidate";
  text: string;
};

export function Transcript({
  items,
}: {
  items: TranscriptItem[];
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
      <h3 className="text-lg font-black">
        Conversation
      </h3>
      <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-sm leading-6 text-slate-400">
            The transcript will appear as the interview begins.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4 ${
                item.speaker ===
                "interviewer"
                  ? "border-emerald-400/15 bg-emerald-400/5"
                  : "border-white/10 bg-slate-900"
              }`}
            >
              <p className="text-xs font-semibold uppercase text-slate-500">
                {item.speaker ===
                "interviewer"
                  ? "Interviewer"
                  : "You"}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                {item.text}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
