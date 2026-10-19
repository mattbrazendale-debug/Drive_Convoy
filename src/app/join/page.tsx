"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { normalizeJoinCode } from "@/lib/join-code";
import { getDeviceId, saveStudentToken } from "@/lib/device";

function JoinInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [error, setError] = useState("");
  const [lobby, setLobby] = useState<any>(null);
  const [confirmName, setConfirmName] = useState<{ studentId: string; displayName: string } | null>(null);

  useEffect(() => {
    const c = params.get("code");
    if (c) lookup(c);
  }, [params]);

  const lookup = async (raw: string) => {
    setError("");
    const joinCode = normalizeJoinCode(raw);
    setCode(joinCode);
    try {
      const data = await api("/api/sessions/join", {
        method: "POST",
        body: JSON.stringify({ joinCode }),
      });
      setLobby(data);
    } catch (e) {
      setError((e as Error).message);
      setLobby(null);
    }
  };

  const claim = async (studentId: string, displayName: string) => {
    const deviceId = getDeviceId();
    const result = await api<any>(`/api/sessions/${lobby.sessionId}/claim`, {
      method: "POST",
      body: JSON.stringify({ studentId, deviceId }),
    });
    if (result.conflict) {
      setError("Hang tight. Your teacher is sorting this out.");
      return;
    }
    saveStudentToken(lobby.sessionId, { studentId });
    router.push(`/drive/${lobby.sessionId}?studentId=${studentId}`);
  };

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem" }} className="stack">
      <h1>Join the convoy</h1>
      {!lobby && (
        <>
          <p className="muted">Enter the code on the big screen</p>
          <input
            className="input"
            style={{ fontSize: "1.5rem", letterSpacing: "0.2em", textAlign: "center" }}
            maxLength={6}
            value={code}
            onChange={(e) => setCode(normalizeJoinCode(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && lookup(code)}
          />
          <button type="button" className="btn" onClick={() => lookup(code)}>Continue</button>
        </>
      )}
      {error && <div className="banner error">{error}</div>}
      {lobby && !confirmName && (
        <div className="stack">
          <p className="muted">{lobby.onBoardCount} on board</p>
          <div className="stack">
            {lobby.roster
              .sort((a: any, b: any) => a.displayName.localeCompare(b.displayName))
              .map((s: any) => (
                <button
                  key={s.studentId}
                  type="button"
                  className="btn secondary"
                  style={{ justifyContent: "flex-start", opacity: s.claimed ? 0.55 : 1 }}
                  onClick={() => setConfirmName({ studentId: s.studentId, displayName: s.displayName })}
                >
                  {s.displayName} {s.claimed ? "· On board" : ""}
                </button>
              ))}
          </div>
          <p className="muted">Can&apos;t see your name? Ask your teacher to add you.</p>
        </div>
      )}
      {confirmName && (
        <div className="card stack">
          <p>You&apos;re {confirmName.displayName}?</p>
          <div className="row">
            <button type="button" className="btn" onClick={() => claim(confirmName.studentId, confirmName.displayName)}>
              Yes, that&apos;s me
            </button>
            <button type="button" className="btn ghost" onClick={() => setConfirmName(null)}>Back</button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<main style={{ padding: "2rem" }}>Loading…</main>}>
      <JoinInner />
    </Suspense>
  );
}
