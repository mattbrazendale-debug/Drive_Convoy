"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DispatchExplainer } from "@/components/DispatchExplainer";
import { useSessionRealtime } from "@/hooks/useSessionRealtime";
import { api } from "@/lib/api";
import { HINT_LIBRARY } from "@/lib/questions";

export default function DispatchPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [bundle, setBundle] = useState<any>(null);
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    api(`/api/sessions/${sessionId}`).then(setBundle);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  useSessionRealtime(sessionId, "dispatch", load);

  if (!bundle) {
    return <main className="dispatch" style={{ padding: "1rem" }}>Loading Dispatch…</main>;
  }

  const { session, dispatch, conflicts, leg, onBoardCount, rosterCount } = bundle;
  const checkIns = dispatch.checkIns.filter((c: any) => !dismissed.has(c.studentId));

  const start = async () => {
    if (onBoardCount < rosterCount * 0.5) {
      const ok = window.confirm(`Only ${onBoardCount} of ${rosterCount} are on board. Start anyway? Others can still join.`);
      if (!ok) return;
    }
    await api(`/api/sessions/${sessionId}/start`, { method: "POST" });
    load();
  };

  const pause = async (action: "pause" | "resume") => {
    await api(`/api/sessions/${sessionId}/pause`, {
      method: "POST",
      body: JSON.stringify({ action: action === "resume" ? "resume" : "pause" }),
    });
    load();
  };

  const sendTow = async (studentId: string, type: "hint" | "buddy" | "rest_stop") => {
    const topicKey = leg?.topicKeys?.[0];
    await api(`/api/sessions/${sessionId}/tow`, {
      method: "POST",
      body: JSON.stringify({ type, studentId, topicKey }),
    });
    load();
  };

  return (
    <main className="dispatch stack" style={{ padding: "1rem", maxWidth: 520, margin: "0 auto" }}>
      <DispatchExplainer open={explainerOpen} onClose={() => setExplainerOpen(false)} />
      <div className="row" style={{ justifyContent: "space-between" }}>
        <Link href="/" className="muted">Drive home</Link>
        <button type="button" className="btn ghost" onClick={() => setExplainerOpen(true)}>?</button>
      </div>
      <h1 style={{ margin: 0 }}>Dispatch</h1>
      <p className="muted">{leg?.landmark.name} · {session.status}</p>
      <p>{dispatch.classTrend}</p>

      {conflicts?.length > 0 && (
        <div className="banner">
          Two devices say they&apos;re {conflicts[0].displayName}.
        </div>
      )}

      {session.status === "lobby" && (
        <>
          <p>{onBoardCount} of {rosterCount} on board</p>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {dispatch.students.map((s: any) => (
              <li key={s.studentId} style={{ padding: "0.5rem 0", opacity: s.onBoard ? 1 : 0.5 }}>
                {s.displayName} {s.onBoard ? "✓ On board" : "Not yet"}
              </li>
            ))}
          </ul>
          <button type="button" className="btn" onClick={start} disabled={onBoardCount < 1}>
            Start the engines
          </button>
        </>
      )}

      {(session.status === "driving" || session.status === "paused" || session.status === "rest_stop") && (
        <>
          <div className="row">
            {session.status === "paused" || session.status === "rest_stop" ? (
              <button type="button" className="btn" onClick={() => pause("resume")}>Resume</button>
            ) : (
              <button type="button" className="btn secondary" onClick={() => pause("pause")}>Pause the convoy</button>
            )}
          </div>
          <section className="card stack">
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Check-ins</h2>
            {checkIns.length === 0 && <p className="muted">No check-ins right now. Keep glancing while they drive.</p>}
            {checkIns.map((c: any) => (
              <div key={c.studentId} className="card" style={{ background: "var(--surface-2)" }}>
                <strong>{c.prompt}</strong>
                <p className="muted" style={{ fontSize: "0.9rem" }}>Flagged because… {c.reason}</p>
                <div className="row">
                  <button type="button" className="btn ghost" onClick={() => sendTow(c.studentId, "hint")}>Send hint tow</button>
                  <button type="button" className="btn ghost" onClick={() => sendTow(c.studentId, "buddy")}>Buddy up</button>
                  <button type="button" className="btn ghost" onClick={() => setDismissed((d) => new Set(d).add(c.studentId))}>Dismiss</button>
                </div>
              </div>
            ))}
          </section>
          <section className="card stack">
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Roster signals</h2>
            {dispatch.students.map((s: any) => (
              <div key={s.studentId} className="row" style={{ justifyContent: "space-between" }}>
                <span>{s.displayName}</span>
                <span className={`signal ${s.signal}`}>{s.signal.replace("_", " ")}</span>
              </div>
            ))}
          </section>
          <section className="card">
            <button type="button" className="btn secondary" onClick={() => sendTow("", "rest_stop")}>Rest stop (whole class)</button>
            <p className="muted" style={{ fontSize: "0.85rem" }}>Topic hint preview: {HINT_LIBRARY[leg.topicKeys[0]]}</p>
          </section>
        </>
      )}

      {session.status === "arrived" && (
        <div className="card stack">
          <h2>Leg complete</h2>
          <p>Per-student progress from this session is saved. Review records will expand in a follow-up release.</p>
          <Link className="btn" href={`/classes/${session.classId}`}>Back to class</Link>
        </div>
      )}
    </main>
  );
}
