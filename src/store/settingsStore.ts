import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SettingCategory, SettingType } from "../types/settings";
import { settings, settingsCategories, getPersistenceKeys } from "./settingsConfig";



type SettingsState = {
  settingsConfig: SettingType[];
  settingsCategories: SettingCategory[];
  setSetting: (settingId: string, value: any) => void;
  getSetting: (settingId: string) => string | boolean;
} & {
  [setting in (typeof settings)[number] as setting["id"]]: setting["initialValue"];
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => {
      const initialState = settings.reduce<Record<string, string | boolean>>(
        (acc, setting) => {
          acc[setting.id] = setting.initialValue;
          return acc;
        },
        {},
      );

      return {
        ...initialState,
        settingsConfig: settings,
        settingsCategories,
        setSetting: (settingId, value) =>
          set(() => {
            return { [settingId]: value };
          }),
        getSetting: (settingId) => get()[settingId],
      } as SettingsState;
    },
    {
      name: "settings-storage",
      partialize: (state) => {
        const persisted: Record<string, any> = {};
        getPersistenceKeys().forEach((key) => {
          persisted[key] = state[key];
        });
        return persisted;
      },
    },
  ),
);

export default useSettingsStore;
