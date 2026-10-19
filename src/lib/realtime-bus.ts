type Bus = {
  broadcastSession: (sessionId: string) => void;
  broadcastTeacher: (teacherId: string, sessionId: string) => void;
  emitLegStarting: (sessionId: string, startsAt: number) => void;
};

let bus: Bus = {
  broadcastSession: () => undefined,
  broadcastTeacher: () => undefined,
  emitLegStarting: () => undefined,
};

export function setRealtimeBus(next: Bus) {
  bus = next;
}

export function realtimeBus() {
  return bus;
}
