export const LEGS_PER_TRIP = 6;
export const LEG_PLANNED_MINUTES = 20;
export const LEG_QUESTION_COUNT = 16;
export const LEG_BONUS_POOL_SIZE = 8;
export const ROSTER_MAX = 40;
export const NAME_MAX_CHARS = 30;
export const SESSION_CODE_TTL_MIN = 120;
export const SESSION_CREATE_TIMEOUT_MS = 5000;
export const DISPATCH_MAX_CLIENTS = 3;
export const DISPATCH_HEARTBEAT_TIMEOUT_MS = 3000;
export const MIN_STUDENTS_TO_START = 1;
export const FUEL_PER_STUDENT_TARGET = 20;
export const COUNTDOWN_MS = 3000;
export const JOIN_CODE_LENGTH = 6;
export const JOIN_MAX_ATTEMPTS = 5;
export const JOIN_LOCKOUT_S = 30;
export const HEARTBEAT_INTERVAL_S = 5;
export const RECONNECTING_AFTER_S = 10;
export const OFFLINE_AFTER_S = 30;
export const OFFLINE_QUEUE_MAX = 20;
export const SYNC_GRACE_MIN = 15;
export const DISPATCH_CHECKIN_MAX = 3;
export const SIGNAL_MIN_ANSWERS = 3;

export const JOIN_ALPHABET = "ACDEFGHJKMNPQRTUVWXY34679";

export type TopicKey =
  | "licence_conditions"
  | "signs_markings"
  | "give_way"
  | "intersections"
  | "hazards"
  | "roundabouts"
  | "speed_following"
  | "impairment";

export type SessionStatus =
  | "lobby"
  | "driving"
  | "paused"
  | "rest_stop"
  | "arrived"
  | "ended"
  | "degraded";

export type StudentSignal =
  | "on_track"
  | "slowing"
  | "stalled"
  | "racing_ahead"
  | "not_started";
