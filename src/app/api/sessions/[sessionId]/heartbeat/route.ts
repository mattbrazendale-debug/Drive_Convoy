import { NextResponse } from "next/server";
import { heartbeat } from "@/lib/session-service";

export async function POST(req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const body = await req.json();
  await heartbeat(sessionId, String(body.studentId));
  return NextResponse.json({ ok: true });
}
