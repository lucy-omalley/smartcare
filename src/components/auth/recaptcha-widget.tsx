"use client";

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark";
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

const SCRIPT_ID = "google-recaptcha-script";
const SCRIPT_SRC = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";

export type RecaptchaWidgetHandle = {
  reset: () => void;
};

type RecaptchaWidgetProps = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
};

export const RecaptchaWidget = forwardRef<RecaptchaWidgetHandle, RecaptchaWidgetProps>(
  function RecaptchaWidget({ onVerify, onExpire, onError }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim();

    const resetWidget = useCallback(() => {
      if (widgetIdRef.current != null && window.grecaptcha) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
    }, []);

    useImperativeHandle(ref, () => ({ reset: resetWidget }), [resetWidget]);

    const renderWidget = useCallback(() => {
      if (!siteKey || !containerRef.current || !window.grecaptcha) return;
      if (widgetIdRef.current != null) {
        window.grecaptcha.reset(widgetIdRef.current);
        return;
      }
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        "expired-callback": onExpire,
        "error-callback": onError,
        theme: "light",
      });
    }, [siteKey, onVerify, onExpire, onError]);

    useEffect(() => {
      if (!siteKey) return;

      window.onRecaptchaLoad = () => renderWidget();

      if (window.grecaptcha) {
        renderWidget();
        return;
      }

      if (!document.getElementById(SCRIPT_ID)) {
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      return () => {
        widgetIdRef.current = null;
      };
    }, [siteKey, renderWidget]);

    if (!siteKey) return null;

    return <div ref={containerRef} className="flex justify-center min-h-[78px]" />;
  }
);

export function isRecaptchaEnabledClient(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim());
}

export function isCaptchaEnabledClient(): boolean {
  return (
    isRecaptchaEnabledClient() ||
    Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim())
  );
}
