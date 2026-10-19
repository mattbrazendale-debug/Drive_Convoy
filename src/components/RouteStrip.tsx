import { TRIP_LEARNER_CORE_V1 } from "@/lib/trip";

export function RouteStrip({
  nextLegId,
  completedLegIds = [],
  compact,
}: {
  nextLegId?: string;
  completedLegIds?: string[];
  compact?: boolean;
}) {
  return (
    <div className="route-strip" aria-label="Trip route">
      {TRIP_LEARNER_CORE_V1.legs.map((leg) => {
        const done = completedLegIds.includes(leg.legId);
        const next = leg.legId === nextLegId;
        return (
          <div
            key={leg.legId}
            className={`leg-chip ${done ? "done" : ""} ${next ? "next" : ""}`}
            style={compact ? { fontSize: "0.75rem" } : undefined}
          >
            {leg.landmark.name}
          </div>
        );
      })}
    </div>
  );
}
