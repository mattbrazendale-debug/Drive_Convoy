import { NextResponse } from "next/server";
import { createTow } from "@/lib/session-service";
import { HINT_LIBRARY } from "@/lib/questions";
import { realtimeBus } from "@/lib/realtime-bus";
import type { TopicKey } from "@/lib/constants";

export async function POST(req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const body = await req.json();
  const type = body.type as "hint" | "buddy" | "rest_stop";
  let hintText = body.hintText as string | undefined;
  if (type === "hint" && body.topicKey) {
    hintText = HINT_LIBRARY[body.topicKey as TopicKey];
  }
  const tow = await createTow({
    sessionId,
    type,
    studentId: body.studentId,
    peerId: body.peerId,
    hintText,
  });
  realtimeBus().broadcastSession(sessionId);
  return NextResponse.json({ tow });
}
