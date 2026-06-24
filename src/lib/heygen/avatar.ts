import type {
  InterviewPersona,
  InterviewRound,
} from "@/lib/types";

export type HeyGenAvatarProfile = {
  avatarName: string;
  voiceId?: string;
  label: string;
  subtitle: string;
};

const fallbackAvatar =
  "Ann_Therapist_public";

export function getHeyGenAvatarProfile(
  persona: InterviewPersona,
  round: InterviewRound
): HeyGenAvatarProfile {
  if (round === "Technical") {
    return {
      avatarName:
        process.env.NEXT_PUBLIC_HEYGEN_TECH_AVATAR ||
        fallbackAvatar,
      label: "Technical Interviewer",
      subtitle:
        "Engineering depth, debugging, and system thinking",
    };
  }

  if (round === "Mixed") {
    return {
      avatarName:
        process.env.NEXT_PUBLIC_HEYGEN_MIXED_AVATAR ||
        fallbackAvatar,
      label: "Mixed Interviewer",
      subtitle:
        "Balanced HR and technical follow-up",
    };
  }

  return {
    avatarName:
      process.env.NEXT_PUBLIC_HEYGEN_HR_AVATAR ||
      fallbackAvatar,
    label:
      persona === "Friendly HR"
        ? "HR Interviewer"
        : "Professional Interviewer",
    subtitle:
      "Communication, ownership, and behavioral signals",
  };
}
