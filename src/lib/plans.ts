import type { PlanKey } from "./types";

export const plans: Record<
  PlanKey,
  {
    name: string;
    price: string;
    description: string;
    features: string[];
    cta: string;
  }
> = {
  FREE: {
    name: "Free",
    price: "₹0",
    description: "Daily resume-aware practice for students and freshers.",
    features: [
      "10 minute interview",
      "Resume + JD based questions",
      "Basic score report",
      "Easy, Medium, Hard difficulty",
      "1 free interview daily",
    ],
    cta: "Start free interview",
  },
  PRO: {
    name: "Pro",
    price: "Rs 199/month",
    description: "Future-ready voice practice with sharper feedback.",
    features: [
      "Voice interview",
      "Cross questions",
      "Detailed report",
      "Higher daily limits",
      "Priority feedback queue",
    ],
    cta: "Coming soon",
  },
  PREMIUM: {
    name: "Premium",
    price: "Rs 299/month",
    description: "Company-specific rounds and coding review workflow.",
    features: [
      "Coding round",
      "AI code review",
      "Company-specific rounds",
      "Advanced analytics",
      "Premium templates",
    ],
    cta: "Coming soon",
  },
};
