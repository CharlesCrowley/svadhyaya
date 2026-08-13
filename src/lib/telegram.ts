import type { PracticeDay, PracticeType } from "./storage";

export const CONSENT_VERSION = "pilot-es-v1";

interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export interface SessionResponse {
  authenticated: true;
  consented: boolean;
  consentVersion?: string;
  locale: string;
}

export function initialiseTelegram(): string {
  const webApp = window.Telegram?.WebApp;
  if (!webApp?.initData) return "";
  webApp.ready();
  webApp.expand();
  return webApp.initData;
}

async function apiFetch<T>(initData: string, path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-telegram-init-data": initData,
      ...options?.headers
    }
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function readSession(initData: string) {
  return apiFetch<SessionResponse>(initData, "/session");
}

export function acceptPrivacyConsent(initData: string) {
  return apiFetch<{ consented: true; consentedAt: string }>(initData, "/consent", {
    method: "POST",
    body: JSON.stringify({
      consentVersion: CONSENT_VERSION,
      timezone: "Europe/Madrid",
      locale: "es"
    })
  });
}

export async function readRemoteHistory(initData: string, throughDate: string): Promise<PracticeDay[]> {
  const response = await apiFetch<{ days: PracticeDay[] }>(
    initData,
    `/history?from=1900-01-01&to=${throughDate}`
  );
  return response.days;
}

export function saveRemotePractice(
  initData: string,
  date: string,
  type: PracticeType,
  complete: boolean,
  minutes?: number
) {
  const body = type === "meditation" && complete ? { complete, minutes } : { complete };
  return apiFetch<void>(initData, `/practice/${date}/${type}`, {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

export function exportRemoteData(initData: string) {
  return apiFetch<unknown>(initData, "/me/export");
}

export function deleteRemoteData(initData: string) {
  return apiFetch<void>(initData, "/me", { method: "DELETE" });
}
