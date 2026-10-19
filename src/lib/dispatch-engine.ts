import { DISPATCH_CHECKIN_MAX, SIGNAL_MIN_ANSWERS, type StudentSignal } from "./constants";
import type { Question } from "./questions";

export interface StudentAnswerSummary {
  studentId: string;
  displayName: string;
  answers: { correct: boolean; topicKey: string; answeredAt: number }[];
  connection: "online" | "reconnecting" | "offline";
  onBoard: boolean;
  questionIndex: number;
  sessionPaused: boolean;
}

export interface CheckIn {
  studentId: string;
  displayName: string;
  prompt: string;
  reason: string;
  score: number;
}

export interface DispatchSnapshot {
  students: {
    studentId: string;
    displayName: string;
    signal: StudentSignal;
    connection: string;
    onBoard: boolean;
    answeredCount: number;
  }[];
  checkIns: CheckIn[];
  classTrend: string;
}

function topicMisses(answers: StudentAnswerSummary["answers"], topic: string, window = 4): number {
  const recent = answers.filter((a) => a.topicKey === topic).slice(-window);
  if (recent.length < 3) return 0;
  return recent.filter((a) => !a.correct).length;
}

function computeSignal(s: StudentAnswerSummary): StudentSignal {
  if (!s.onBoard) return "not_started";
  if (s.answers.length < SIGNAL_MIN_ANSWERS) return "on_track";
  if (s.connection !== "online" || s.sessionPaused) return "on_track";
  const recent = s.answers.slice(-5);
  const accuracy = recent.filter((a) => a.correct).length / recent.length;
  const lastAt = recent[recent.length - 1]?.answeredAt ?? 0;
  const idleMs = Date.now() - lastAt;
  if (idleMs > 120_000) return "stalled";
  if (accuracy < 0.4) return "stalled";
  if (accuracy < 0.6) return "slowing";
  if (accuracy > 0.9 && s.questionIndex > 8) return "racing_ahead";
  return "on_track";
}

export function buildDispatchSnapshot(students: StudentAnswerSummary[]): DispatchSnapshot {
  const enriched = students.map((s) => ({
    studentId: s.studentId,
    displayName: s.displayName,
    signal: computeSignal(s),
    connection: s.connection,
    onBoard: s.onBoard,
    answeredCount: s.answers.length,
  }));

  const checkInCandidates: CheckIn[] = [];
  for (const s of students) {
    if (!s.onBoard || s.answers.length < SIGNAL_MIN_ANSWERS) continue;
    const signal = computeSignal(s);
    const topics = [...new Set(s.answers.map((a) => a.topicKey))];
    for (const topic of topics) {
      const misses = topicMisses(s.answers, topic);
      if (misses >= 3) {
        const label = topic.replace(/_/g, " ");
        checkInCandidates.push({
          studentId: s.studentId,
          displayName: s.displayName,
          prompt: `Check in on ${label} with ${s.displayName}.`,
          reason: `${s.displayName} has missed 3 of the last 4 ${label} questions.`,
          score: 90 + misses,
        });
      }
    }
    if (signal === "stalled") {
      checkInCandidates.push({
        studentId: s.studentId,
        displayName: s.displayName,
        prompt: `See if ${s.displayName} is stuck or just needs a moment.`,
        reason: `Flagged because answers have slowed and recent accuracy is low.`,
        score: 70,
      });
    }
  }

  const checkIns = [...checkInCandidates]
    .sort((a, b) => b.score - a.score)
    .filter(
      (c, i, arr) => arr.findIndex((x) => x.studentId === c.studentId) === i,
    )
    .slice(0, DISPATCH_CHECKIN_MAX);

  const stalled = enriched.filter((s) => s.signal === "stalled").length;
  const slowing = enriched.filter((s) => s.signal === "slowing").length;
  const classTrend =
    stalled > 0
      ? `${stalled} student${stalled > 1 ? "s" : ""} may need a check-in.`
      : slowing > 0
        ? "Most of the class is moving; a few are slowing on recent topics."
        : "The convoy is rolling steadily.";

  return { students: enriched, checkIns, classTrend };
}

export function fuelForAnswer(correct: boolean, wasRecovery: boolean): number {
  let fuel = 1;
  if (correct) fuel += 1;
  if (wasRecovery) fuel += 1;
  return fuel;
}

export function wasRecovery(
  answers: { correct: boolean; topicKey: string }[],
  topicKey: string,
  correct: boolean,
): boolean {
  if (!correct) return false;
  const prev = answers.filter((a) => a.topicKey === topicKey);
  if (prev.length === 0) return false;
  return prev[prev.length - 1]?.correct === false;
}
