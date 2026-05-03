import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserState {
  streak: number;
  lastCompletionDate: string | null;
  totalXP: number;
  coins: number;
  questsCompleted: number;
  avatar: string;
  inventory: string[];
  todayCompletedSkills: Record<string, string[]>; // "YYYY-MM-DD": ["Python", "Git"]
  questSubmissions: Record<string, string>; // "YYYY-MM-DD-Skill": "my code or notes"
  
  // Actions
  completeQuest: (skill: string, content: string, xpReward: number, coinReward: number, rareItem?: string) => void;
  equipAvatar: (icon: string) => void;
  buyAvatar: (icon: string, price: number) => boolean;
  checkStreak: () => void;
  resetDemo: () => void;
}

const INITIAL_STATE = {
  streak: 0,
  lastCompletionDate: null,
  totalXP: 0,
  coins: 50,
  questsCompleted: 0,
  avatar: '🧑‍💻',
  inventory: ['🧑‍💻'],
  todayCompletedSkills: {},
  questSubmissions: {},
};

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getDaysDiff = (date1: string, date2: string) => {
  const d1 = new Date(date1); const d2 = new Date(date2);
  d1.setHours(0,0,0,0); d2.setHours(0,0,0,0);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      checkStreak: () => set((state) => {
        if (!state.lastCompletionDate) return state;
        const diff = getDaysDiff(state.lastCompletionDate, getTodayStr());
        if (diff > 1) {
          return { streak: Math.max(0, state.streak - (diff - 1)) };
        }
        return state;
      }),

      completeQuest: (skill, content, xpReward, coinReward, rareItem) => set((state) => {
        const today = getTodayStr();
        const completedToday = state.todayCompletedSkills[today] || [];
        
        if (completedToday.includes(skill)) return state; // already done
        
        let newStreak = state.streak;
        if (state.lastCompletionDate !== today) {
          newStreak += 1;
        }

        const newInventory = rareItem && !state.inventory.includes(rareItem) 
          ? [...state.inventory, rareItem] 
          : state.inventory;

        const submissionKey = `${today}-${skill}`;

        return {
          totalXP: state.totalXP + xpReward,
          coins: state.coins + coinReward,
          questsCompleted: state.questsCompleted + 1,
          streak: newStreak,
          lastCompletionDate: today,
          inventory: newInventory,
          todayCompletedSkills: {
            ...state.todayCompletedSkills,
            [today]: [...completedToday, skill]
          },
          questSubmissions: {
            ...state.questSubmissions,
            [submissionKey]: content
          }
        };
      }),

      equipAvatar: (icon) => set({ avatar: icon }),

      buyAvatar: (icon, price) => {
        const state = get();
        if (state.coins >= price && !state.inventory.includes(icon)) {
          set({
            coins: state.coins - price,
            inventory: [...state.inventory, icon]
          });
          return true;
        }
        return false;
      },

      resetDemo: () => set({ ...INITIAL_STATE })
    }),
    {
      name: 'codechest-storage', // key in localStorage
    }
  )
);
