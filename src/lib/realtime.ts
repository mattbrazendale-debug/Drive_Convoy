export type ServerToClientEvents = {
  session_updated: (payload: { sessionId: string }) => void;
  leg_starting: (payload: { sessionId: string; startsAt: number }) => void;
  tow_delivered: (payload: { sessionId: string; towId: string }) => void;
};

export type ClientToServerEvents = {
  subscribe_session: (sessionId: string, role: "projector" | "dispatch" | "student") => void;
  subscribe_teacher: (teacherId: string) => void;
};

export function sessionRoom(sessionId: string, role: string) {
  return `session:${sessionId}:${role}`;
}

export function teacherRoom(teacherId: string) {
  return `teacher:${teacherId}`;
}
