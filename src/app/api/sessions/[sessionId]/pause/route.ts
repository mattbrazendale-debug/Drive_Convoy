import { NextResponse } from "next/server";
import { setSessionStatus } from "@/lib/session-service";
import { realtimeBus } from "@/lib/realtime-bus";

export async function POST(req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const body = await req.json();
  const action = body.action === "resume" ? "driving" : "paused";
  await setSessionStatus(sessionId, action === "driving" ? "driving" : "paused");
  realtimeBus().broadcastSession(sessionId);
  return NextResponse.json({ status: action });
}
