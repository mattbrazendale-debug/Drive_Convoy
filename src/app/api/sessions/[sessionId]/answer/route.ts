import { NextResponse } from "next/server";
import { submitAnswer } from "@/lib/session-service";
import { realtimeBus } from "@/lib/realtime-bus";
import { getQuestionById } from "@/lib/questions";

export async function POST(req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const body = await req.json();
  const question = getQuestionById(String(body.questionId));
  if (!question) return NextResponse.json({ error: "Unknown question" }, { status: 400 });
  const choiceIndex = Number(body.choiceIndex);
  const correct = choiceIndex === question.correctIndex;
  const result = await submitAnswer({
    sessionId,
    studentId: String(body.studentId),
    questionId: question.id,
    correct,
    topicKey: question.topicKey,
    legId: String(body.legId),
    clientAnswerId: String(body.clientAnswerId),
    answeredAt: body.answeredAt ? new Date(body.answeredAt) : new Date(),
  });
  realtimeBus().broadcastSession(sessionId);
  return NextResponse.json({
    ...result,
    correct,
    explanation: question.explanation,
  });
}
