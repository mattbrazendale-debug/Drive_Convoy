"use client";

const DEVICE_KEY = "convoy_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function saveStudentToken(sessionId: string, token: { studentId: string }) {
  sessionStorage.setItem(`convoy:${sessionId}:student`, JSON.stringify(token));
  localStorage.setItem(`convoy:${sessionId}:student`, JSON.stringify(token));
}

export function loadStudentToken(sessionId: string): { studentId: string } | null {
  const raw =
    sessionStorage.getItem(`convoy:${sessionId}:student`) ??
    localStorage.getItem(`convoy:${sessionId}:student`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { studentId: string };
  } catch {
    return null;
  }
}
