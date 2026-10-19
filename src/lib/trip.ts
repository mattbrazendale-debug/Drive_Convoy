import type { TopicKey } from "./constants";

export interface LegLandmark {
  name: string;
  region: string;
  imageUrl: string;
  altText: string;
}

export interface LegDefinition {
  legId: string;
  order: number;
  title: string;
  landmark: LegLandmark;
  topicKeys: TopicKey[];
  plannedMinutes: number;
}

export const TRIP_LEARNER_CORE_V1 = {
  tripId: "trip_learner_core_v1",
  title: "Learner Licence Road Trip",
  legs: [
    {
      legId: "leg_01_waitomo",
      order: 1,
      title: "Licence Conditions & Signs",
      landmark: {
        name: "Waitomo",
        region: "Waikato",
        imageUrl: "/landmarks/waitomo.svg",
        altText: "Glowworm caves entrance at Waitomo",
      },
      topicKeys: ["licence_conditions", "signs_markings"] as TopicKey[],
      plannedMinutes: 20,
    },
    {
      legId: "leg_02_taupo",
      order: 2,
      title: "Give Way & Intersections",
      landmark: {
        name: "Taupō",
        region: "Waikato",
        imageUrl: "/landmarks/taupo.svg",
        altText: "Lake Taupō at dawn with mountains on the far shore",
      },
      topicKeys: ["give_way", "intersections"] as TopicKey[],
      plannedMinutes: 20,
    },
    {
      legId: "leg_03_tongariro",
      order: 3,
      title: "Hazards & Conditions",
      landmark: {
        name: "Tongariro",
        region: "Central North Island",
        imageUrl: "/landmarks/tongariro.svg",
        altText: "Volcanic peaks of Tongariro National Park",
      },
      topicKeys: ["hazards"] as TopicKey[],
      plannedMinutes: 20,
    },
    {
      legId: "leg_04_whanganui",
      order: 4,
      title: "Roundabouts",
      landmark: {
        name: "Whanganui",
        region: "Manawatū-Whanganui",
        imageUrl: "/landmarks/whanganui.svg",
        altText: "Whanganui River valley",
      },
      topicKeys: ["roundabouts"] as TopicKey[],
      plannedMinutes: 20,
    },
    {
      legId: "leg_05_kaikoura",
      order: 5,
      title: "Speed & Following Distance",
      landmark: {
        name: "Kaikōura",
        region: "Canterbury",
        imageUrl: "/landmarks/kaikoura.svg",
        altText: "Kaikōura coastline with mountains",
      },
      topicKeys: ["speed_following"] as TopicKey[],
      plannedMinutes: 20,
    },
    {
      legId: "leg_06_aoraki",
      order: 6,
      title: "Alcohol, Drugs & Fatigue",
      landmark: {
        name: "Aoraki / Mount Cook",
        region: "Canterbury",
        imageUrl: "/landmarks/aoraki.svg",
        altText: "Aoraki Mount Cook above alpine foothills",
      },
      topicKeys: ["impairment"] as TopicKey[],
      plannedMinutes: 20,
    },
  ] satisfies LegDefinition[],
};

export function getLeg(legId: string): LegDefinition | undefined {
  return TRIP_LEARNER_CORE_V1.legs.find((l) => l.legId === legId);
}

export function getNextLegId(classId: string, completedLegIds: string[]): string {
  const legs = TRIP_LEARNER_CORE_V1.legs;
  const next = legs.find((l) => !completedLegIds.includes(l.legId));
  return next?.legId ?? legs[0].legId;
}
