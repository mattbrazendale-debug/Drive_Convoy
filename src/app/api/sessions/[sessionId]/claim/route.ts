import { NextResponse } from "next/server";
import { claimName } from "@/lib/session-service";
import { realtimeBus } from "@/lib/realtime-bus";

export async function POST(req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const body = await req.json();
  const studentId = String(body.studentId);
  const deviceId = String(body.deviceId);
  const result = await claimName(sessionId, studentId, deviceId);
  realtimeBus().broadcastSession(sessionId);
  return NextResponse.json(result);
}
