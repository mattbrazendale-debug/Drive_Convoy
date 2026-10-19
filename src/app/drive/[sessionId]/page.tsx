"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Countdown } from "@/components/Countdown";
import { useSessionRealtime } from "@/hooks/useSessionRealtime";
import { api } from "@/lib/api";
import { loadStudentToken } from "@/lib/device";

function DriveInner() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const search = useSearchParams();
  const [studentId, setStudentId] = useState(search.get("studentId") ?? "");
  const [bundle, setBundle] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<number | null>(null);
  const [countdownDone, setCountdownDone] = useState(true);
  const [banner, setBanner] = useState<string | null>(null);
  const [towHint, setTowHint] = useState<string | null>(null);

  useEffect(() => {
    const token = loadStudentToken(sessionId);
    if (token?.studentId) setStudentId(token.studentId);
  }, [sessionId]);

  const load = useCallback(() => {
    api(`/api/sessions/${sessionId}`).then((b) => {
      setBundle(b);
      const claim = b.dispatch?.students?.find((s: any) => s.studentId === studentId);
      if (claim?.questionIndex) setIndex(claim.questionIndex);
      const latestTow = b.session?.tows?.find((t: any) => t.studentId === studentId && t.type === "hint");
      if (latestTow?.hintText) setTowHint(latestTow.hintText);
    });
  }, [sessionId, studentId]);

  useEffect(() => {
    if (studentId) load();
  }, [studentId, load]);

  useSessionRealtime(sessionId, "student", load, (at) => {
    setStartsAt(at);
    setCountdownDone(false);
  });

  useEffect(() => {
    if (!studentId) return;
    const id = setInterval(() => {
      api(`/api/sessions/${sessionId}/heartbeat`, {
        method: "POST",
        body: JSON.stringify({ studentId }),
      }).catch(() => setBanner("Reconnecting…"));
    }, 5000);
    return () => clearInterval(id);
  }, [sessionId, studentId]);

  const session = bundle?.session;
  const questions = bundle?.questions ?? [];
  const q = questions[index];

  const answer = async (choiceIndex: number) => {
    if (!q || !studentId) return;
    const clientAnswerId = crypto.randomUUID();
    const res = await api<any>(`/api/sessions/${sessionId}/answer`, {
      method: "POST",
      body: JSON.stringify({
        studentId,
        questionId: q.id,
        choiceIndex,
        legId: session.legId,
        clientAnswerId,
        answeredAt: new Date().toISOString(),
      }),
    });
    setFeedback(res.correct ? "Nice one." : res.explanation);
    setIndex((i) => i + 1);
    setTimeout(() => setFeedback(null), 2000);
    load();
  };

  if (!studentId) {
    return <main style={{ padding: "1.5rem" }}>Pick your name to join.</main>;
  }

  if (!bundle) {
    return <main style={{ padding: "1.5rem" }}>Loading your lane…</main>;
  }

  if (session.status === "lobby") {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "1.5rem" }} className="stack">
        {startsAt && !countdownDone && <Countdown startsAt={startsAt} onDone={() => setCountdownDone(true)} />}
        <h1>You&apos;re on board</h1>
        <p className="muted">Waiting for the convoy to leave…</p>
        <p>{bundle.onBoardCount} on board</p>
      </main>
    );
  }

  if (session.status === "paused") {
    return (
      <main style={{ padding: "2rem", opacity: 0.6 }}>
        <h1>Eyes up</h1>
        <p>Your teacher has paused the convoy.</p>
      </main>
    );
  }

  if (session.status === "rest_stop") {
    return (
      <main style={{ padding: "2rem" }} className="stack">
        <h1>Rest stop</h1>
        <p>Your teacher has pulled the class over for a quick reset. Eyes up until you&apos;re back on the road.</p>
      </main>
    );
  }

  if (session.status === "arrived" || session.status === "ended") {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>The convoy has arrived</h1>
        <p>Your answers are saved.</p>
      </main>
    );
  }

  if (!q) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>You&apos;re caught up</h1>
        <p className="muted">Keep helping the class reach the landmark.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "1rem" }} className="stack">
      {banner && <div className="banner" style={{ borderLeftColor: "#6b7280" }}>{banner}</div>}
      {towHint && <div className="banner">Tow from your teacher: {towHint}</div>}
      <p className="muted">Question {index + 1} of {questions.length}</p>
      <h2 style={{ fontSize: "1.2rem" }}>{q.prompt}</h2>
      <div className="stack">
        {q.choices.map((choice: string, i: number) => (
          <button key={i} type="button" className="btn secondary" style={{ justifyContent: "flex-start" }} onClick={() => answer(i)}>
            {choice}
          </button>
        ))}
      </div>
      {feedback && <p>{feedback}</p>}
    </main>
  );
}

export default function DrivePage() {
  return (
    <Suspense fallback={<main style={{ padding: "2rem" }}>Loading…</main>}>
      <DriveInner />
    </Suspense>
  );
}
