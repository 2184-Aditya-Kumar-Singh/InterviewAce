import Link from "next/link";
import { ArrowRight, Check, FileText, Gauge, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { plans } from "@/lib/plans";

const featureCards: Array<[string, string, LucideIcon]> = [
  ["Resume intelligence", "Upload PDF/DOCX and edit extracted skills, education, and projects.", FileText],
  ["JD matching", "Detect target role, required skills, missing skills, and match percentage.", Gauge],
  ["Secure by design", "Supabase auth, guarded routes, input validation, and API rate limiting.", ShieldCheck],
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#08111f] text-white">
      <section className="relative min-h-[92vh] px-4 py-6 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,.35),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,.2),transparent_26%),linear-gradient(135deg,#07111f,#111827_48%,#052e2b)]" />
        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-400 text-slate-950">
              <Sparkles size={20} />
            </span>
            InterviewAce
          </Link>
          <div className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <Link href="/auth" className="hover:text-white">Login</Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 pb-14 pt-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pt-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-sm text-emerald-100">
              <Gauge size={16} />
              Free-tier optimized mock interviews
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-tight tracking-normal text-white sm:text-6xl lg:text-7xl">
              InterviewAce
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Practice resume and JD-aware AI interviews with role matching, timed answers, coding-round UI, and
              clear improvement reports built for students, freshers, and job seekers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Start free interview
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/coding"
                className="focus-ring inline-flex items-center justify-center rounded-lg border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Try coding round UI
              </Link>
            </div>
          </div>

          <div className="glass rounded-lg p-5">
            <div className="rounded-lg border border-white/10 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Live mock session</p>
                  <p className="text-2xl font-semibold">Frontend Developer</p>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-200">10:00</span>
              </div>
              <div className="mt-6 rounded-lg bg-white p-5 text-slate-950">
                <p className="text-sm font-medium text-emerald-700">Question 03</p>
                <p className="mt-2 text-xl font-semibold">
                  Explain a project trade-off and how it maps to React, TypeScript, and SQL requirements.
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {["Resume parsed", "JD match 78%", "Difficulty Hard"].map((item) => (
                  <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-950 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
          {featureCards.map(([title, body, Icon]) => (
            <div key={String(title)} className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
              <Icon className="text-emerald-300" size={24} />
              <h2 className="mt-4 text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="bg-white px-4 py-20 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-semibold sm:text-4xl">Plans that start at zero cost</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {Object.values(plans).map((plan) => (
              <div key={plan.name} className="rounded-lg border border-slate-200 p-6 shadow-sm">
                <p className="text-lg font-semibold">{plan.name}</p>
                <p className="mt-3 text-4xl font-semibold">{plan.price}</p>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 text-emerald-600" size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth"
                  className="mt-6 inline-flex w-full justify-center rounded-lg bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-slate-100 px-4 py-20 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-semibold">FAQ</h2>
          <div className="mt-8 space-y-4">
            {[
              ["Can I run it for free?", "Yes. Next.js on Vercel, Supabase free tier, and local mock AI fallback keep the base app free."],
              ["Do I need an OpenAI key?", "No. The app generates deterministic mock questions without a key. Add OPENAI_API_KEY for real LLM questions."],
              ["Are paid plans active?", "They are future-ready placeholders. The schema and UI are prepared for payment integration later."],
            ].map(([q, a]) => (
              <div key={q} className="rounded-lg bg-white p-5">
                <h3 className="font-semibold">{q}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
