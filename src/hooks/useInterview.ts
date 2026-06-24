"use client";

import {
  useCallback,
  useState,
} from "react";

import type {
  InterviewStatus,
} from "@/components/interview/StatusIndicator";

const transitions: Record<
  InterviewStatus,
  InterviewStatus[]
> = {
  IDLE: [
    "PROCESSING",
    "LISTENING",
    "WAITING_FOR_USER",
    "ERROR",
  ],
  LISTENING: [
    "PROCESSING",
    "WAITING_FOR_USER",
    "ERROR",
  ],
  PROCESSING: [
    "AVATAR_SPEAKING",
    "WAITING_FOR_USER",
    "ERROR",
  ],
  AVATAR_SPEAKING: [
    "WAITING_FOR_USER",
    "ERROR",
  ],
  WAITING_FOR_USER: [
    "LISTENING",
    "PROCESSING",
    "ERROR",
  ],
  ERROR: [
    "IDLE",
    "PROCESSING",
    "WAITING_FOR_USER",
  ],
};

export function useInterview(
  initial: InterviewStatus = "IDLE"
) {
  const [status, setStatus] =
    useState<InterviewStatus>(
      initial
    );

  const transitionTo =
    useCallback(
      (next: InterviewStatus) => {
        setStatus((current) =>
          current === next ||
          transitions[
            current
          ].includes(next)
            ? next
            : current
        );
      },
      []
    );

  return {
    status,
    transitionTo,
    canListen:
      status ===
        "WAITING_FOR_USER" ||
      status === "IDLE",
    isBusy:
      status ===
        "PROCESSING" ||
      status ===
        "AVATAR_SPEAKING",
  };
}
