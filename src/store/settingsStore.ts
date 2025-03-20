
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // Theme settings
  theme: 'light' | 'dark' | 'system';
  // UI settings
  showNoteDates: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setShowNoteDates: (show: boolean) => void;
}

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default settings
      theme: 'system',
      showNoteDates: true,
      
      // Actions
      setTheme: (theme) => set({ theme }),
      setShowNoteDates: (show) => set({ showNoteDates: show }),
    }),
    {
      name: 'markdown-notes-settings',
    }
  )
);

export default useSettingsStore;
