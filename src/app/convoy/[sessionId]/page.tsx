"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { RouteStrip } from "@/components/RouteStrip";
import { Countdown } from "@/components/Countdown";
import { useSessionRealtime } from "@/hooks/useSessionRealtime";
import { api } from "@/lib/api";
import { appUrl } from "@/lib/config";

export default function ConvoyScreenPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [bundle, setBundle] = useState<any>(null);
  const [qr, setQr] = useState("");
  const [startsAt, setStartsAt] = useState<number | null>(null);
  const [countdownDone, setCountdownDone] = useState(false);

  const load = useCallback(() => {
    api(`/api/sessions/${sessionId}`).then(setBundle);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  useSessionRealtime(sessionId, "projector", load, (at) => {
    setStartsAt(at);
    setCountdownDone(false);
  });

  useEffect(() => {
    if (!bundle?.projector?.joinCode) return;
    const url = `${appUrl()}/join?code=${bundle.projector.joinCode}`;
    QRCode.toDataURL(url, { width: 280, margin: 1 }).then(setQr);
  }, [bundle?.projector?.joinCode]);

  if (!bundle) {
    return <div className="projector" style={{ padding: "2rem" }}>Loading convoy screen…</div>;
  }

  const { leg, projector, session } = bundle;
  const joinUrl = appUrl().replace(/^https?:\/\//, "");

  const start = async () => {
    await api(`/api/sessions/${sessionId}/start`, { method: "POST" });
  };

  return (
    <div className="projector stack" style={{ padding: "2rem", gap: "1.5rem" }}>
      {startsAt && !countdownDone && (
        <Countdown startsAt={startsAt} onDone={() => setCountdownDone(true)} />
      )}
      <RouteStrip nextLegId={session.legId} compact />
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div style={{ flex: 1 }} className="stack">
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 4rem)" }}>Next stop: {leg?.landmark.name}</h1>
          <p className="muted" style={{ fontSize: "1.25rem" }}>{leg?.title}</p>
          <p style={{ fontSize: "1.25rem" }}>
            Go to <strong>{joinUrl}/join</strong> and enter
          </p>
          <div className="join-code" aria-label="Join code">{projector.joinCode}</div>
          {qr && <img src={qr} alt="QR code to join the convoy" width={280} height={280} />}
        </div>
      </div>
      <p style={{ fontSize: "1.5rem" }}>
        <strong>{projector.onBoardCount}</strong> of <strong>{projector.rosterCount}</strong> on board
      </p>
      {session.status === "driving" || session.status === "paused" ? (
        <div className="stack" style={{ maxWidth: 720 }}>
          <div className="fuel-bar" aria-label="Class fuel gauge">
            <div className="fuel-fill" style={{ width: `${projector.fuelPct}%` }} />
          </div>
          <p style={{ fontSize: "1.25rem" }}>
            {session.status === "paused" ? "Pulled over" : `Fuel ${projector.fuelPct}%`}
          </p>
        </div>
      ) : (
        <button type="button" className="btn secondary" onClick={start}>Start the engines</button>
      )}
      {session.status === "arrived" && (
        <h2>You&apos;ve arrived at {leg?.landmark.name}!</h2>
      )}
    </div>
  );
}
