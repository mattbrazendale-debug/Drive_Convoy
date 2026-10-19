import { NextResponse } from "next/server";
import { getSessionBundle } from "@/lib/session-service";

export async function GET(_: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const bundle = await getSessionBundle(sessionId);
  if (!bundle) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const { session, ...rest } = bundle;
  const projector = {
    sessionId: session.id,
    status: session.status,
    legId: session.legId,
    joinCode: session.joinCode,
    fuelCurrent: session.fuelCurrent,
    fuelTarget: session.fuelTarget,
    onBoardCount: bundle.onBoardCount,
    rosterCount: bundle.rosterCount,
    fuelPct: bundle.fuelPct,
  };
  return NextResponse.json({
    session,
    projector,
    ...rest,
  });
}
