export const DEMO_TEACHER_ID = process.env.TEACHER_DEMO_ID ?? "tch_demo";
export const DEMO_SCHOOL_ID = process.env.SCHOOL_DEMO_ID ?? "sch_demo";

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
