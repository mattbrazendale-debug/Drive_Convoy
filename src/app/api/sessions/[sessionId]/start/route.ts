import { NextResponse } from "next/server";
import { startEngines } from "@/lib/session-service";
import { realtimeBus } from "@/lib/realtime-bus";

export async function POST(_: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const result = await startEngines(sessionId);
  realtimeBus().emitLegStarting(sessionId, result.startsAt);
  realtimeBus().broadcastSession(sessionId);
  return NextResponse.json(result);
}
