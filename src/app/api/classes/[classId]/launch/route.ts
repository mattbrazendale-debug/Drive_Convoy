import { NextResponse } from "next/server";
import { launchLeg } from "@/lib/session-service";
import { realtimeBus } from "@/lib/realtime-bus";
import { DEMO_TEACHER_ID } from "@/lib/config";

export async function POST(req: Request, ctx: { params: Promise<{ classId: string }> }) {
  const { classId } = await ctx.params;
  const body = await req.json();
  const legId = String(body.legId);
  const session = await launchLeg(classId, legId);
  realtimeBus().broadcastSession(session.id);
  realtimeBus().broadcastTeacher(DEMO_TEACHER_ID, session.id);
  return NextResponse.json({ session });
}
