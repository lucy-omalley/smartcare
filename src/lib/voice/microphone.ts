export type MicrophoneSupport =
  | { ok: true }
  | { ok: false; reason: string; hint?: string };

export function checkMicrophoneSupport(): MicrophoneSupport {
  if (typeof window === "undefined") {
    return { ok: false, reason: "Recording is only available in the browser." };
  }

  if (!window.isSecureContext) {
    return {
      ok: false,
      reason: "Microphone requires a secure connection (HTTPS).",
      hint: "Open Parenfy via https://parenfy.com rather than an insecure link.",
    };
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      reason: "This browser does not support voice recording.",
      hint: "Try Safari or Chrome on your phone, or update your browser.",
    };
  }

  return { ok: true };
}

export function microphoneErrorMessage(error: unknown): { title: string; hint?: string } {
  const name = error instanceof DOMException ? error.name : "";
  const msg = error instanceof Error ? error.message : String(error);

  if (name === "NotAllowedError" || msg.includes("Permission denied")) {
    return {
      title: "Microphone permission was blocked.",
      hint: "Tap the lock or site icon in your browser bar → allow Microphone for parenfy.com, then reload this page.",
    };
  }

  if (name === "NotFoundError") {
    return {
      title: "No microphone was found on this device.",
      hint: "Connect a headset or use a phone with a built-in mic.",
    };
  }

  if (name === "NotReadableError" || name === "AbortError") {
    return {
      title: "Your microphone is in use by another app.",
      hint: "Close other apps using the mic (Zoom, FaceTime, etc.) and try again.",
    };
  }

  if (name === "SecurityError" || msg.includes("Permissions policy")) {
    return {
      title: "Microphone is blocked by browser security settings.",
      hint: "Update the app if you just deployed a fix, then hard-refresh this page.",
    };
  }

  return {
    title: "Could not access the microphone.",
    hint: "Check browser settings → Site permissions → Microphone → Allow for parenfy.com.",
  };
}

export function pickRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}
