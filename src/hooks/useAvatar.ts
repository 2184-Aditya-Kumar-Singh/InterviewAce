"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  LiveAvatarSession,
} from "@heygen/liveavatar-web-sdk";
import {
  AgentEventsEnum,
  SessionEvent,
  SessionInteractivityMode,
  SessionState,
} from "@heygen/liveavatar-web-sdk";

import type {
  HeyGenAvatarProfile,
} from "@/lib/heygen/avatar";

export type AvatarState =
  | "IDLE"
  | "CONNECTING"
  | "READY"
  | "AVATAR_SPEAKING"
  | "DISCONNECTED"
  | "ERROR";

type LiveAvatarSessionConstructor =
  typeof LiveAvatarSession;

function getErrorMessage(
  error: unknown
) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "string"
  ) {
    return error;
  }

  if (
    error &&
    typeof error === "object"
  ) {
    try {
      return JSON.stringify(error);
    } catch {
      return "Avatar connection failed.";
    }
  }

  return "Avatar connection failed.";
}

export function useAvatar(
  profile: HeyGenAvatarProfile,
  enabled: boolean
) {
  const avatarRef =
    useRef<LiveAvatarSession | null>(
      null
    );
  const videoElementRef =
    useRef<HTMLVideoElement | null>(
      null
    );
  const pendingSpeakResolveRef =
    useRef<(() => void) | null>(
      null
    );
  const [state, setState] =
    useState<AvatarState>("IDLE");
  const [error, setError] =
    useState("");

  const attachVideo =
    useCallback(
      (
        element: HTMLVideoElement | null
      ) => {
        videoElementRef.current =
          element;

        if (
          element &&
          avatarRef.current
        ) {
          avatarRef.current.attach(
            element
          );
        }
      },
      []
    );

  const stop = useCallback(async () => {
    pendingSpeakResolveRef.current?.();
    pendingSpeakResolveRef.current =
      null;

    try {
      await avatarRef.current?.stop();
    } catch (stopError) {
      console.error(stopError);
    }

    if (videoElementRef.current) {
      videoElementRef.current.srcObject =
        null;
    }

    avatarRef.current = null;
    setState("DISCONNECTED");
  }, []);

  const start = useCallback(async () => {
    if (
      !enabled ||
      state === "CONNECTING" ||
      state === "READY" ||
      state === "AVATAR_SPEAKING"
    ) {
      return;
    }

    try {
      setError("");
      setState("CONNECTING");

      const tokenResponse =
        await fetch(
          "/api/heygen/token",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              avatarId:
                profile.avatarName,
            }),
          }
        );
      const tokenData =
        await tokenResponse.json();

      if (
        !tokenResponse.ok ||
        !tokenData?.sessionToken
      ) {
        throw new Error(
          tokenData?.error ||
            "Could not connect to LiveAvatar interviewer."
        );
      }

      const avatarSdk =
        await import(
          "@heygen/liveavatar-web-sdk"
        );
      const AvatarClient =
        avatarSdk.LiveAvatarSession as LiveAvatarSessionConstructor;

      const avatar =
        new AvatarClient(
          tokenData.sessionToken,
          {
            voiceChat: {
              defaultMuted: true,
              mode: SessionInteractivityMode.PUSH_TO_TALK,
            },
          }
        );

      avatar.on(
        SessionEvent.SESSION_STREAM_READY,
        () => {
          if (
            videoElementRef.current
          ) {
            avatar.attach(
              videoElementRef.current
            );
          }
          setState("READY");
        }
      );

      avatar.on(
        SessionEvent.SESSION_STATE_CHANGED,
        (sessionState) => {
          if (
            sessionState ===
            SessionState.CONNECTING
          ) {
            setState("CONNECTING");
          }

          if (
            sessionState ===
            SessionState.CONNECTED
          ) {
            setState("READY");
          }
        }
      );

      avatar.on(
        AgentEventsEnum.AVATAR_SPEAK_STARTED,
        () => {
          setState("AVATAR_SPEAKING");
        }
      );

      avatar.on(
        AgentEventsEnum.AVATAR_SPEAK_ENDED,
        () => {
          setState("READY");
          pendingSpeakResolveRef.current?.();
          pendingSpeakResolveRef.current =
            null;
        }
      );

      avatar.on(
        SessionEvent.SESSION_DISCONNECTED,
        () => {
          setState("DISCONNECTED");
        }
      );

      avatarRef.current = avatar;

      await avatar.start();
    } catch (startError) {
      console.error(startError);
      setError(
        getErrorMessage(
          startError
        )
      );
      setState("ERROR");
    }
  }, [
    enabled,
    profile.avatarName,
    state,
  ]);

  const speak = useCallback(
    async (text: string) => {
      if (
        !enabled ||
        !text.trim()
      )
        return;

      if (!avatarRef.current) {
        await start();
      }

      const avatar =
        avatarRef.current;

      if (!avatar) {
        return;
      }

      setState("AVATAR_SPEAKING");
      avatar.repeat(text);

      await new Promise<void>(
        (resolve) => {
          const timeout =
            window.setTimeout(
              resolve,
              Math.min(
                30000,
                Math.max(
                  4000,
                  text.length * 65
                )
              )
            );

          pendingSpeakResolveRef.current =
            () => {
              window.clearTimeout(
                timeout
              );
              resolve();
            };
        }
      );
    },
    [enabled, start]
  );

  const showListening =
    useCallback(() => {
      try {
        avatarRef.current?.startListening();
      } catch (listenError) {
        console.error(listenError);
      }
    }, []);

  const stopListening =
    useCallback(() => {
      try {
        avatarRef.current?.stopListening();
      } catch (listenError) {
        console.error(listenError);
      }
    }, []);

  useEffect(() => {
    if (enabled) {
      queueMicrotask(() => {
        start();
      });
    }

    return () => {
      stop();
    };
  }, [enabled]);

  return {
    state,
    error,
    attachVideo,
    start,
    speak,
    stop,
    showListening,
    stopListening,
    isSpeaking:
      state === "AVATAR_SPEAKING",
    isConnecting:
      state === "CONNECTING",
    isReady: state === "READY",
  };
}
