"use client";

import { useState } from "react";
import { Check, Crown, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { plans } from "@/lib/plans";
import type { InterviewPlan } from "@/lib/types";

const planRank: Record<InterviewPlan, number> = { FREE: 0, PRO: 1, PREMIUM: 2 };

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState<InterviewPlan>(() => {
    if (typeof window === "undefined") return "FREE";
    const saved = window.localStorage.getItem("interviewace:plan") as InterviewPlan | null;
    return saved === "FREE" || saved === "PRO" || saved === "PREMIUM" ? saved : "FREE";
  });

  function subscribe(plan: InterviewPlan) {
    window.localStorage.setItem("interviewace:plan", plan);
    setCurrentPlan(plan);
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-5">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-emerald-200">Manage subscription</p>
                <h1 className="mt-2 text-3xl font-semibold">Choose your interview plan</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Higher plans include every feature below them. Premium users can still use Pro and Free interview modes.
                </p>
              </div>
              <span className="w-fit rounded-full bg-emerald-400 px-3 py-1 text-sm font-bold text-slate-950">
                Current: {plans[currentPlan].name}
              </span>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {(["FREE", "PRO", "PREMIUM"] as InterviewPlan[]).map((key) => {
              const plan = plans[key];
              const included = planRank[currentPlan] >= planRank[key];
              return (
                <div key={key} className={`rounded-lg border p-5 ${included ? "border-emerald-300/40 bg-emerald-400/10" : "border-white/10 bg-white/[0.04]"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold">{plan.name}</p>
                      <p className="mt-2 text-3xl font-semibold">{plan.price}</p>
                    </div>
                    {key === "PREMIUM" ? <Crown className="text-emerald-300" /> : <Sparkles className="text-sky-300" />}
                  </div>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-slate-300">{plan.description}</p>
                  <ul className="mt-5 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm text-slate-200">
                        <Check className="mt-0.5 text-emerald-300" size={16} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => subscribe(key)}
                    className={`mt-6 w-full rounded-lg px-4 py-3 font-semibold ${
                      currentPlan === key ? "bg-white/10 text-white" : "bg-emerald-400 text-slate-950"
                    }`}
                  >
                    {currentPlan === key ? "Current plan" : key === "FREE" ? "Use free" : `Subscribe to ${plan.name}`}
                  </button>
                  {included && currentPlan !== key && (
                    <p className="mt-3 text-sm text-emerald-100">Included with your {plans[currentPlan].name} plan.</p>
                  )}
                </div>
              );
            })}
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
