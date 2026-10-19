import type { TopicKey } from "./constants";
import { LEG_QUESTION_COUNT } from "./constants";

export interface Question {
  id: string;
  topicKey: TopicKey;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

const bank: Question[] = [
  {
    id: "q_lc_01",
    topicKey: "licence_conditions",
    prompt: "On a learner licence, you must drive with a supervisor who has held a full NZ licence for at least:",
    choices: ["6 months", "1 year", "2 years", "5 years"],
    correctIndex: 2,
    explanation: "Learner drivers need a supervisor who has held a full licence for at least two years.",
  },
  {
    id: "q_sm_01",
    topicKey: "signs_markings",
    prompt: "A red circle with a white horizontal bar means:",
    choices: ["No entry", "Stop", "Give way", "Speed limit ends"],
    correctIndex: 0,
    explanation: "This sign means no entry for vehicles from your direction.",
  },
  {
    id: "q_gw_01",
    topicKey: "give_way",
    prompt: "At a T-intersection, who must give way?",
    choices: ["Traffic on the continuing road", "Traffic on the terminating road", "The faster vehicle", "Whoever arrives last"],
    correctIndex: 1,
    explanation: "Traffic on the road that ends must give way to traffic on the continuing road.",
  },
  {
    id: "q_int_01",
    topicKey: "intersections",
    prompt: "When turning right at an intersection with no signals, you give way to:",
    choices: ["Traffic turning left from the opposite direction", "Traffic going straight from the opposite direction", "Pedestrians only", "No one"],
    correctIndex: 1,
    explanation: "Give way to all oncoming traffic that is going straight or turning left.",
  },
  {
    id: "q_haz_01",
    topicKey: "hazards",
    prompt: "In heavy rain, you should increase your following distance because:",
    choices: ["Braking takes longer", "Fuel use rises", "Tyres wear faster", "Headlights are brighter"],
    correctIndex: 0,
    explanation: "Wet roads reduce grip, so stopping distances increase.",
  },
  {
    id: "q_rb_01",
    topicKey: "roundabouts",
    prompt: "When approaching a roundabout, you must:",
    choices: ["Speed up to merge", "Give way to all traffic already on the roundabout", "Stop always", "Use your horn"],
    correctIndex: 1,
    explanation: "Give way to vehicles already circulating on the roundabout.",
  },
  {
    id: "q_sp_01",
    topicKey: "speed_following",
    prompt: "The two-second rule helps you judge:",
    choices: ["Tyre pressure", "Safe following distance", "When to overtake", "Parking distance"],
    correctIndex: 1,
    explanation: "Pick a fixed point; the car ahead should pass it at least two seconds before you do.",
  },
  {
    id: "q_imp_01",
    topicKey: "impairment",
    prompt: "Fatigue affects driving similarly to:",
    choices: ["Low tyre pressure", "Alcohol impairment", "A clean windscreen", "Good visibility"],
    correctIndex: 1,
    explanation: "Being tired slows reactions and judgment much like alcohol.",
  },
];

function expandBank(): Question[] {
  const expanded: Question[] = [];
  let i = 0;
  while (expanded.length < LEG_QUESTION_COUNT * 6) {
    const base = bank[i % bank.length];
    expanded.push({
      ...base,
      id: `${base.id}_${Math.floor(i / bank.length)}`,
      prompt: i < bank.length ? base.prompt : `${base.prompt} (practice ${Math.floor(i / bank.length) + 1})`,
    });
    i += 1;
  }
  return expanded;
}

const FULL_BANK = expandBank();

export function questionsForLeg(legId: string, topicKeys: TopicKey[]): Question[] {
  const filtered = FULL_BANK.filter((q) => topicKeys.includes(q.topicKey));
  const pool = filtered.length >= LEG_QUESTION_COUNT ? filtered : FULL_BANK;
  const hash = legId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const start = hash % Math.max(1, pool.length - LEG_QUESTION_COUNT);
  return pool.slice(start, start + LEG_QUESTION_COUNT);
}

export function getQuestionById(id: string): Question | undefined {
  return FULL_BANK.find((q) => q.id === id);
}

export const HINT_LIBRARY: Record<TopicKey, string> = {
  licence_conditions: "Remember: learner drivers need a qualified supervisor and must display L plates.",
  signs_markings: "Shape and colour tell you the sign type before you read the words.",
  give_way: "At T-intersections, the road that ends gives way to the continuing road.",
  intersections: "Scan left–right–left, and give way to oncoming traffic when turning right.",
  hazards: "Slow down early for rain, sun strike, and narrow shoulders.",
  roundabouts: "Give way before you enter; signal left when you exit.",
  speed_following: "Use the two-second rule; add more time in poor conditions.",
  impairment: "Plan rest breaks; fatigue is as risky as driving impaired.",
};
