"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type StreamingAvatar from "@heygen/streaming-avatar";
import {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion,
} from "@heygen/streaming-avatar";

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

type StreamingAvatarConstructor =
  typeof StreamingAvatar;

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
    const record =
      error as Record<
        string,
        unknown
      >;

    const directMessage =
      record.message ||
      record.error ||
      record.detail;

    if (
      typeof directMessage ===
      "string"
    ) {
      return directMessage;
    }

    if (
      record.response &&
      typeof record.response ===
        "object"
    ) {
      const response =
        record.response as Record<
          string,
          unknown
        >;
      const responseMessage =
        response.message ||
        response.error ||
        response.data;

      if (
        typeof responseMessage ===
        "string"
      ) {
        return responseMessage;
      }
    }

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
    useRef<StreamingAvatar | null>(
      null
    );
  const pendingSpeakResolveRef =
    useRef<(() => void) | null>(
      null
    );
  const [
    mediaStream,
    setMediaStream,
  ] = useState<MediaStream | null>(
    null
  );
  const [state, setState] =
    useState<AvatarState>("IDLE");
  const [error, setError] =
    useState("");

  const stop = useCallback(async () => {
    pendingSpeakResolveRef.current?.();
    pendingSpeakResolveRef.current =
      null;

    try {
      await avatarRef.current?.stopAvatar();
    } catch (stopError) {
      console.error(stopError);
    }

    mediaStream
      ?.getTracks()
      .forEach((track) =>
        track.stop()
      );

    avatarRef.current = null;
    setMediaStream(null);
    setState("DISCONNECTED");
  }, [mediaStream]);

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
          }
        );
      const tokenData =
        await tokenResponse.json();

      if (
        !tokenResponse.ok ||
        !tokenData?.token
      ) {
        throw new Error(
          tokenData?.error ||
            "Could not connect to HeyGen avatar."
        );
      }

      const avatarSdk =
        await import(
          "@heygen/streaming-avatar"
        );
      const AvatarClient =
        avatarSdk.default as StreamingAvatarConstructor;

      const avatar =
        new AvatarClient({
          token: tokenData.token,
        });

      avatar.on(
        StreamingEvents.STREAM_READY,
        (stream: MediaStream) => {
          setMediaStream(stream);
          setState("READY");
        }
      );

      avatar.on(
        StreamingEvents.AVATAR_START_TALKING,
        () => {
          setState("AVATAR_SPEAKING");
        }
      );

      avatar.on(
        StreamingEvents.AVATAR_STOP_TALKING,
        () => {
          setState("READY");
          pendingSpeakResolveRef.current?.();
          pendingSpeakResolveRef.current =
            null;
        }
      );

      avatar.on(
        StreamingEvents.STREAM_DISCONNECTED,
        () => {
          setState("DISCONNECTED");
          setMediaStream(null);
        }
      );

      avatarRef.current = avatar;

      await avatar.createStartAvatar({
        quality:
          AvatarQuality.Medium,
        avatarName:
          profile.avatarName,
        voice: {
          voiceId:
            profile.voiceId,
          rate: 1,
          emotion:
            VoiceEmotion.FRIENDLY,
        },
        language: "en",
        activityIdleTimeout: 600,
      });
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
    profile.voiceId,
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

      await avatar.speak({
        text,
        task_type: TaskType.REPEAT,
        taskMode: TaskMode.SYNC,
      });

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
    useCallback(async () => {
      await avatarRef.current?.startListening();
    }, []);

  const stopListening =
    useCallback(async () => {
      await avatarRef.current?.stopListening();
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
    mediaStream,
    state,
    error,
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
