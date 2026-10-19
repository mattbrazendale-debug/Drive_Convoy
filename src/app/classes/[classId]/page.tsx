"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RouteStrip } from "@/components/RouteStrip";
import { DispatchExplainer } from "@/components/DispatchExplainer";
import { api } from "@/lib/api";
import { TRIP_LEARNER_CORE_V1 } from "@/lib/trip";

export default function ClassHomePage() {
  const { classId } = useParams<{ classId: string }>();
  const router = useRouter();
  const [home, setHome] = useState<any>(null);
  const [explainerOpen, setExplainerOpen] = useState(false);

  const load = useCallback(() => {
    api(`/api/classes/${classId}`).then(setHome).catch(() => setHome(null));
    api<{ seen: boolean }>("/api/teacher/explainer").then((d) => {
      if (!d.seen) setExplainerOpen(true);
    });
  }, [classId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!home) {
    return <main style={{ padding: "2rem" }}>Loading trip overview…</main>;
  }

  const { cls, nextLeg, completedLegIds, liveSession } = home;
  const rosterCount = cls.roster.length;

  const launch = async () => {
    const { session } = await api<{ session: { id: string } }>(`/api/classes/${classId}/launch`, {
      method: "POST",
      body: JSON.stringify({ legId: nextLeg.legId }),
    });
    window.open(`/convoy/${session.id}`, "_blank", "noopener,noreferrer");
    router.push(`/dispatch/${session.id}`);
  };

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.25rem" }} className="stack">
      <DispatchExplainer open={explainerOpen} onClose={() => setExplainerOpen(false)} />
      <div className="row" style={{ justifyContent: "space-between" }}>
        <Link href="/" className="muted">← Classes</Link>
        <button type="button" className="btn ghost" onClick={() => setExplainerOpen(true)}>?</button>
      </div>
      <h1 style={{ margin: 0 }}>{cls.name}</h1>
      <p className="muted">{TRIP_LEARNER_CORE_V1.title}</p>
      <RouteStrip nextLegId={nextLeg.legId} completedLegIds={completedLegIds} />
      <div className="card stack">
        <span className="leg-chip next" style={{ alignSelf: "flex-start" }}>Next up</span>
        <h2 style={{ margin: 0 }}>Leg {nextLeg.order}: {nextLeg.landmark.name}</h2>
        <p className="muted">{nextLeg.title} · {nextLeg.plannedMinutes} min</p>
        {rosterCount === 0 ? (
          <Link className="btn secondary" href={`/classes/${classId}/roster`}>Add your students</Link>
        ) : (
          <div className="row">
            <button type="button" className="btn" onClick={launch}>
              Launch Leg {nextLeg.order}: {nextLeg.landmark.name}
            </button>
            <Link className="btn ghost" href={`/classes/${classId}/roster`}>Edit roster</Link>
          </div>
        )}
        {liveSession && (
          <div className="banner">
            Leg is running.{" "}
            <Link href={`/dispatch/${liveSession.id}`}>Open Dispatch</Link>
          </div>
        )}
      </div>
    </main>
  );
}
