import { prisma } from "./db";
import { newId } from "./ids";
import { generateJoinCode } from "./join-code";
import { buildDispatchSnapshot, fuelForAnswer, wasRecovery } from "./dispatch-engine";
import { questionsForLeg } from "./questions";
import { getLeg, TRIP_LEARNER_CORE_V1 } from "./trip";
import {
  COUNTDOWN_MS,
  FUEL_PER_STUDENT_TARGET,
  SESSION_CODE_TTL_MIN,
  type SessionStatus,
} from "./constants";

export async function ensureDemoTeacher(teacherId: string, schoolId: string) {
  await prisma.teacher.upsert({
    where: { id: teacherId },
    create: { id: teacherId, schoolId, displayName: "Demo Teacher" },
    update: {},
  });
}

export async function createClass(input: {
  teacherId: string;
  schoolId: string;
  name: string;
  yearLevel?: number;
  idempotencyKey?: string;
}) {
  const existing = input.idempotencyKey
    ? await prisma.classGroup.findFirst({
        where: { name: input.name, teacherId: input.teacherId },
      })
    : null;
  if (existing) return existing;

  return prisma.classGroup.create({
    data: {
      id: newId("cls"),
      teacherId: input.teacherId,
      schoolId: input.schoolId,
      name: input.name,
      yearLevel: input.yearLevel,
      tripId: TRIP_LEARNER_CORE_V1.tripId,
    },
  });
}

export async function addStudentLive(
  classId: string,
  entry: { givenName: string; familyInitial?: string; displayName: string },
) {
  return prisma.rosterEntry.create({
    data: {
      id: newId("stu"),
      classId,
      givenName: entry.givenName,
      familyInitial: entry.familyInitial,
      displayName: entry.displayName,
      source: "live_add",
    },
  });
}

export async function saveRoster(
  classId: string,
  entries: { givenName: string; familyInitial?: string; displayName: string }[],
) {
  const count = await prisma.rosterEntry.count({ where: { classId, active: true } });
  if (count > 0) {
    throw new Error("Roster already exists; edit from class settings in a future release.");
  }
  await prisma.rosterEntry.createMany({
    data: entries.map((e) => ({
      id: newId("stu"),
      classId,
      givenName: e.givenName,
      familyInitial: e.familyInitial,
      displayName: e.displayName,
      source: "paste",
    })),
  });
  return prisma.rosterEntry.count({ where: { classId, active: true } });
}

export async function getClassHome(classId: string) {
  const cls = await prisma.classGroup.findUnique({
    where: { id: classId },
    include: {
      roster: { where: { active: true }, orderBy: { displayName: "asc" } },
      sessions: { orderBy: { launchedAt: "desc" }, take: 5 },
    },
  });
  if (!cls) return null;
  const completedLegIds = cls.sessions
    .filter((s) => s.status === "arrived" || s.status === "ended")
    .map((s) => s.legId);
  const nextLeg =
    TRIP_LEARNER_CORE_V1.legs.find((l) => !completedLegIds.includes(l.legId)) ??
    TRIP_LEARNER_CORE_V1.legs[0];
  const live = cls.sessions.find((s) =>
    ["lobby", "driving", "paused", "rest_stop"].includes(s.status),
  );
  return { cls, nextLeg, completedLegIds, liveSession: live };
}

export async function launchLeg(classId: string, legId: string) {
  const leg = getLeg(legId);
  if (!leg) throw new Error("Unknown leg");

  const existing = await prisma.session.findFirst({
    where: {
      classId,
      status: { in: ["lobby", "driving", "paused", "rest_stop"] },
    },
  });
  if (existing) return existing;

  let joinCode = generateJoinCode();
  for (let i = 0; i < 5; i += 1) {
    const clash = await prisma.session.findUnique({ where: { joinCode } });
    if (!clash) break;
    joinCode = generateJoinCode();
  }

  return prisma.session.create({
    data: {
      id: newId("ses"),
      classId,
      legId,
      joinCode,
      status: "lobby",
      flagsJson: JSON.stringify({ FEATURE_TOWS: true }),
    },
  });
}

export async function getJoinLobby(joinCode: string) {
  const session = await prisma.session.findUnique({
    where: { joinCode: joinCode.toUpperCase() },
    include: {
      class: { include: { roster: { where: { active: true } } } },
      claims: true,
    },
  });
  if (!session) return null;
  if (session.status === "ended" || session.status === "arrived") {
    return { session, ended: true as const };
  }
  const leg = getLeg(session.legId);
  const claimedIds = new Set(session.claims.map((c) => c.studentId));
  const roster = session.class.roster.map((s) => ({
    studentId: s.id,
    displayName: s.displayName,
    claimed: claimedIds.has(s.id),
  }));
  return {
    session,
    ended: false as const,
    leg,
    roster,
    onBoardCount: session.claims.length,
    rosterCount: session.class.roster.length,
  };
}

export async function claimName(sessionId: string, studentId: string, deviceId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { claims: true, class: { include: { roster: true } } },
  });
  if (!session) throw new Error("Session not found");
  const student = session.class.roster.find((r) => r.id === studentId && r.active);
  if (!student) throw new Error("Student not found");

  const existing = session.claims.find((c) => c.studentId === studentId);
  if (existing && existing.deviceId !== deviceId) {
    await prisma.sessionClaim.update({
      where: { id: existing.id },
      data: { conflictPending: true },
    });
    return { conflict: true as const, claimId: existing.id };
  }

  const claim = await prisma.sessionClaim.upsert({
    where: { sessionId_studentId: { sessionId, studentId } },
    create: {
      id: newId("clm"),
      sessionId,
      studentId,
      deviceId,
    },
    update: { deviceId, lastSeenAt: new Date(), conflictPending: false },
  });

  return { conflict: false as const, claim, student };
}

export async function resolveNameConflict(
  sessionId: string,
  studentId: string,
  keep: "first" | "new",
) {
  const claims = await prisma.sessionClaim.findMany({
    where: { sessionId, studentId },
  });
  const claim = claims[0];
  if (!claim) return;
  if (keep === "first") {
    await prisma.sessionClaim.update({
      where: { id: claim.id },
      data: { conflictPending: false },
    });
  } else {
    await prisma.sessionClaim.update({
      where: { id: claim.id },
      data: { conflictPending: false, lastSeenAt: new Date() },
    });
  }
}

export async function startEngines(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { claims: true },
  });
  if (!session) throw new Error("Session not found");
  const presentCount = session.claims.length;
  const fuelTarget = presentCount * FUEL_PER_STUDENT_TARGET;
  const startsAt = Date.now() + COUNTDOWN_MS;
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      status: "driving",
      startedAt: new Date(startsAt),
      fuelTarget,
      fuelCurrent: session.fuelCurrent,
    },
  });
  return { startsAt, fuelTarget, presentCount };
}

export async function setSessionStatus(sessionId: string, status: SessionStatus) {
  return prisma.session.update({
    where: { id: sessionId },
    data: {
      status,
      endedAt: status === "ended" || status === "arrived" ? new Date() : undefined,
    },
  });
}

export async function submitAnswer(input: {
  sessionId: string;
  studentId: string;
  questionId: string;
  correct: boolean;
  topicKey: string;
  legId: string;
  clientAnswerId: string;
  answeredAt: Date;
}) {
  const existing = await prisma.answerEvent.findUnique({
    where: { clientAnswerId: input.clientAnswerId },
  });
  if (existing) return { duplicate: true as const, fuelAdded: 0 };

  const prior = await prisma.answerEvent.findMany({
    where: { sessionId: input.sessionId, studentId: input.studentId },
    orderBy: { answeredAt: "asc" },
  });
  const recovery = wasRecovery(
    prior.map((p) => ({ correct: p.correct, topicKey: p.topicKey })),
    input.topicKey,
    input.correct,
  );
  const fuelAdded = fuelForAnswer(input.correct, recovery);

  await prisma.$transaction(async (tx) => {
    await tx.answerEvent.create({
      data: {
        id: newId("ans"),
        sessionId: input.sessionId,
        studentId: input.studentId,
        questionId: input.questionId,
        legId: input.legId,
        correct: input.correct,
        topicKey: input.topicKey,
        answeredAt: input.answeredAt,
        clientAnswerId: input.clientAnswerId,
      },
    });
    await tx.session.update({
      where: { id: input.sessionId },
      data: { fuelCurrent: { increment: fuelAdded } },
    });
    const answerCount = prior.length + 1;
    await tx.sessionClaim.updateMany({
      where: { sessionId: input.sessionId, studentId: input.studentId },
      data: {
        questionIndex: answerCount,
        lastSeenAt: new Date(),
        connection: "online",
      },
    });
  });

  const session = await prisma.session.findUnique({ where: { id: input.sessionId } });
  const arrived =
    session && session.fuelTarget > 0 && session.fuelCurrent >= session.fuelTarget;
  if (arrived && session.status === "driving") {
    await setSessionStatus(sessionId, "arrived");
  }
  return { duplicate: false as const, fuelAdded, arrived: !!arrived };
}

export async function heartbeat(sessionId: string, studentId: string) {
  await prisma.sessionClaim.updateMany({
    where: { sessionId, studentId },
    data: { lastSeenAt: new Date(), connection: "online" },
  });
}

export async function getSessionBundle(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      class: { include: { roster: { where: { active: true } } } },
      claims: true,
      answers: { orderBy: { answeredAt: "asc" } },
      tows: { where: { status: "delivered" }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!session) return null;
  const leg = getLeg(session.legId);
  const questions = leg ? questionsForLeg(leg.legId, leg.topicKeys) : [];
  const now = Date.now();

  const students = session.class.roster.map((r) => {
    const claim = session.claims.find((c) => c.studentId === r.id);
    const answers = session.answers
      .filter((a) => a.studentId === r.id)
      .map((a) => ({
        correct: a.correct,
        topicKey: a.topicKey,
        answeredAt: a.answeredAt.getTime(),
      }));
    let connection: "online" | "reconnecting" | "offline" = "offline";
    if (claim) {
      const age = now - claim.lastSeenAt.getTime();
      if (age < 10_000) connection = "online";
      else if (age < 30_000) connection = "reconnecting";
      else connection = "offline";
      if (claim.connection === "offline") connection = "offline";
    }
    return {
      studentId: r.id,
      displayName: r.displayName,
      answers,
      connection,
      onBoard: !!claim,
      questionIndex: claim?.questionIndex ?? 0,
      sessionPaused: session.status === "paused",
      conflictPending: claim?.conflictPending ?? false,
    };
  });

  const dispatch = buildDispatchSnapshot(students);
  const fuelPct =
    session.fuelTarget > 0
      ? Math.min(100, Math.round((session.fuelCurrent / session.fuelTarget) * 100))
      : 0;

  const conflicts = session.claims
    .filter((c) => c.conflictPending)
    .map((c) => {
      const student = session.class.roster.find((r) => r.id === c.studentId);
      return { studentId: c.studentId, displayName: student?.displayName ?? "Student" };
    });

  return {
    session,
    leg,
    questions,
    dispatch,
    fuelPct,
    onBoardCount: session.claims.length,
    rosterCount: session.class.roster.length,
    conflicts,
  };
}

export async function createTow(input: {
  sessionId: string;
  type: "hint" | "buddy" | "rest_stop";
  studentId?: string;
  peerId?: string;
  hintText?: string;
}) {
  const tow = await prisma.tow.create({
    data: {
      id: newId("tow"),
      sessionId: input.sessionId,
      type: input.type,
      studentId: input.studentId,
      peerId: input.peerId,
      hintText: input.hintText,
      status: "delivered",
      deliveredAt: new Date(),
    },
  });
  if (input.type === "rest_stop") {
    await setSessionStatus(input.sessionId, "rest_stop");
  }
  return tow;
}

export function isSessionCodeExpired(session: { launchedAt: Date; endedAt: Date | null }) {
  if (session.endedAt) return true;
  const ttl = SESSION_CODE_TTL_MIN * 60 * 1000;
  return Date.now() - session.launchedAt.getTime() > ttl;
}
