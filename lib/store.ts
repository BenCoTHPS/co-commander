import { create } from 'zustand';

interface AppState {
  twitchUser: any | null;
  setTwitchUser: (user: any) => void;
}

export const useAppStore = create<AppState>((set) => ({
  twitchUser: null,
  setTwitchUser: (user) => set({ twitchUser: user }),
}));