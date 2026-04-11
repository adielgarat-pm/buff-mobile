// ─── Mock data used across all screens ────────────────────────────────────────
// Replace with real Supabase queries when ready.

import { Task } from '../types/task';

// ── Shared types ─────────────────────────────────────────────────────────────

export interface MockChild {
  id: string;
  name: string;
  age: number;
  avatar: string;        // emoji
  petName: string;
  petStage: 'egg' | 'hatchling' | 'scout' | 'guardian';
  buffs: number;         // total earned
  tasksCompleted: number;
  tasksTotal: number;
  streak: number;        // days
  weekGoal: number;      // % (70 target)
}

export interface MockTask {
  id: string;
  title: string;
  stage: 'Morning' | 'School' | 'Afternoon' | 'Evening';
  points: number;
  done: boolean;
  time: string;
  childId?: string;
}

export interface MockReward {
  id: string;
  title: string;
  description: string;
  cost: number;          // Buffs
  icon: string;          // emoji
  claimed: boolean;
}

// ── Parent mock data ──────────────────────────────────────────────────────────

export const MOCK_CHILDREN: MockChild[] = [
  {
    id: 'child-1',
    name: 'Itai',
    age: 10,
    avatar: '🐉',
    petName: 'Spark',
    petStage: 'scout',
    buffs: 1240,
    tasksCompleted: 7,
    tasksTotal: 10,
    streak: 5,
    weekGoal: 74,
  },
  {
    id: 'child-2',
    name: 'Ami',
    age: 7,
    avatar: '🐱',
    petName: 'Luna',
    petStage: 'hatchling',
    buffs: 480,
    tasksCompleted: 3,
    tasksTotal: 8,
    streak: 2,
    weekGoal: 51,
  },
];

export const MOCK_TASKS_PARENT: MockTask[] = [
  { id: 't1', title: 'Brush Teeth', stage: 'Morning', points: 10, done: true, time: '07:00', childId: 'child-1' },
  { id: 't2', title: 'Get Dressed', stage: 'Morning', points: 10, done: true, time: '07:15', childId: 'child-1' },
  { id: 't3', title: 'Healthy Breakfast', stage: 'Morning', points: 15, done: false, time: '07:30', childId: 'child-1' },
  { id: 't4', title: 'Pack Bag', stage: 'Morning', points: 10, done: false, time: '07:45', childId: 'child-1' },
  { id: 't5', title: 'Homework', stage: 'Afternoon', points: 30, done: false, time: '16:00', childId: 'child-1' },
  { id: 't6', title: 'Brush Teeth', stage: 'Morning', points: 10, done: true, time: '07:00', childId: 'child-2' },
  { id: 't7', title: 'Reading', stage: 'Afternoon', points: 20, done: false, time: '16:30', childId: 'child-2' },
];

export const MOCK_REWARDS_PARENT: MockReward[] = [
  { id: 'r1', title: 'Extra Screen Time', description: '30 minutes extra', cost: 100, icon: '📱', claimed: false },
  { id: 'r2', title: 'Choose Dinner', description: 'Pick what the family eats', cost: 150, icon: '🍕', claimed: false },
  { id: 'r3', title: 'Movie Night', description: 'Family movie of their choice', cost: 300, icon: '🎬', claimed: false },
  { id: 'r4', title: 'Day Trip', description: 'Weekend adventure destination', cost: 1000, icon: '🗺️', claimed: false },
];

export const MOCK_WEEKLY_INSIGHTS = {
  ignitionRate: 71,
  strongestCategory: 'Morning Routine',
  mostActiveWindow: '7:00 – 9:00 AM',
  trend: 'up' as const,
  coachingTip: 'Itai\'s mornings are his superpower — build on them this week.',
};

// ── Child mock data ───────────────────────────────────────────────────────────

export const MOCK_MY_CHILD: MockChild = MOCK_CHILDREN[0];

export const MOCK_TASKS_CHILD: MockTask[] = [
  { id: 'ct1', title: '😁 Sparkling Smile', stage: 'Morning', points: 10, done: true, time: '07:00' },
  { id: 'ct2', title: '👕 Getting Ready Hero', stage: 'Morning', points: 10, done: true, time: '07:15' },
  { id: 'ct3', title: '🥣 Power Breakfast', stage: 'Morning', points: 15, done: false, time: '07:30' },
  { id: 'ct4', title: '🎒 Mission Prep', stage: 'Morning', points: 10, done: false, time: '07:45' },
  { id: 'ct5', title: '📚 Focus Mode', stage: 'Afternoon', points: 30, done: false, time: '16:00' },
  { id: 'ct6', title: '🥗 Healthy Growth', stage: 'Afternoon', points: 15, done: false, time: '18:00' },
  { id: 'ct7', title: '🌙 Recharging Battery', stage: 'Evening', points: 15, done: false, time: '21:00' },
];

export const MOCK_REWARDS_CHILD: MockReward[] = [
  { id: 'cr1', title: 'Extra Screen Time', description: '30 minutes', cost: 100, icon: '📱', claimed: false },
  { id: 'cr2', title: 'Choose Dinner', description: 'You pick tonight!', cost: 150, icon: '🍕', claimed: false },
  { id: 'cr3', title: 'Movie Night', description: 'Any movie!', cost: 300, icon: '🎬', claimed: false },
  { id: 'cr4', title: 'Day Trip', description: 'Weekend adventure', cost: 1000, icon: '🗺️', claimed: false },
];

// ── Phase-aware tasks (used by PhaseView) ────────────────────────────────────
// scheduleDays: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
// completedAt: set to demonstrate out-of-window timestamp display

// Today at a given hour/minute — helper for mock completedAt values
const today = (h: number, m = 0) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

export const MOCK_PHASE_TASKS: Task[] = [
  // ── Morning (06:00–09:00) ─────────────────────────────────────────────────
  {
    id: 'pt1',
    title: '😁 Sparkling Smile',
    time: '07:00',
    category: 'self-care',
    credits: 10,
    completed: true,
    completedAt: today(7, 5),       // in-window ✓
    scheduleDays: [0, 1, 2, 3, 4, 5],
  },
  {
    id: 'pt2',
    title: '👕 Getting Ready Hero',
    time: '07:15',
    category: 'organization',
    credits: 10,
    completed: true,
    completedAt: today(14, 30),     // out-of-window: completed at 14:30 ⚠
    scheduleDays: [0, 1, 2, 3, 4, 5],
  },
  {
    id: 'pt3',
    title: '🥣 Power Breakfast',
    time: '07:30',
    category: 'self-care',
    credits: 15,
    completed: false,
    scheduleDays: [0, 1, 2, 3, 4, 5],
    description: 'Eat something before leaving',
  },
  {
    id: 'pt4',
    title: '🎒 Mission Prep',
    time: '07:45',
    category: 'organization',
    credits: 10,
    completed: false,
    scheduleDays: [0, 1, 2, 3, 4, 5],
  },

  // ── School (09:00–14:00 by default) ─────────────────────────────────────
  {
    id: 'pt5',
    title: '📓 Copy Homework',
    time: '09:30',
    category: 'organization',
    credits: 10,
    completed: true,
    completedAt: today(9, 35),      // in-window ✓
    scheduleDays: [0, 1, 2, 3, 4],
  },
  {
    id: 'pt6',
    title: '🤝 Ask for Help',
    time: '11:00',
    category: 'learning',
    credits: 15,
    completed: false,
    scheduleDays: [0, 1, 2, 3, 4],
    description: 'Raise your hand when stuck',
  },
  {
    id: 'pt7',
    title: '🚰 Water Break',
    time: '12:00',
    category: 'movement',
    credits: 5,
    completed: true,
    completedAt: today(20, 0),      // out-of-window: completed at 20:00 ⚠
    scheduleDays: [0, 1, 2, 3, 4, 5],
  },

  // ── Afternoon (14:00–18:00) ───────────────────────────────────────────────
  {
    id: 'pt8',
    title: '📚 Focus Mode',
    time: '15:00',
    category: 'learning',
    credits: 30,
    completed: false,
    scheduleDays: [0, 1, 2, 3, 4],
    description: 'Homework — start with the hardest subject',
  },
  {
    id: 'pt9',
    title: '🏃 Movement Quest',
    time: '16:30',
    category: 'movement',
    credits: 15,
    completed: true,
    completedAt: today(16, 35),     // in-window ✓
    scheduleDays: [0, 1, 2, 3, 4, 5],
  },
  {
    id: 'pt10',
    title: '🧹 Tidy Up Zone',
    time: '17:00',
    category: 'responsibility',
    credits: 10,
    completed: false,
    scheduleDays: [0, 1, 2, 3, 4, 5],
  },

  // ── Evening (18:00+) ──────────────────────────────────────────────────────
  {
    id: 'pt11',
    title: '🥗 Healthy Growth',
    time: '18:30',
    category: 'self-care',
    credits: 15,
    completed: false,
    scheduleDays: [0, 1, 2, 3, 4, 5],
  },
  {
    id: 'pt12',
    title: '📖 Story Time',
    time: '20:00',
    category: 'learning',
    credits: 20,
    completed: true,
    completedAt: today(20, 10),     // in-window ✓
    scheduleDays: [0, 1, 2, 3, 4, 5],
  },
  {
    id: 'pt13',
    title: '🌙 Recharging Battery',
    time: '21:00',
    category: 'self-care',
    credits: 15,
    completed: false,
    scheduleDays: [0, 1, 2, 3, 4, 5],
    description: 'Lights out, phone away',
  },
];

// ── Pet stage config ──────────────────────────────────────────────────────────

export const PET_STAGES = {
  egg:       { emoji: '🥚', label: 'Egg',      xpNeeded: 100 },
  hatchling: { emoji: '🐣', label: 'Hatchling', xpNeeded: 500 },
  scout:     { emoji: '🐉', label: 'Scout',    xpNeeded: 1500 },
  guardian:  { emoji: '🔮', label: 'Guardian', xpNeeded: Infinity },
} as const;
