
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SettingCategory, SettingType } from "../types/settings";
import { settings, settingsCategories, getPersistenceKeys } from "./settingsConfig";

// Create a type that extracts all setting IDs
type SettingId = (typeof settings)[number]["id"];

type SettingValueType<T extends SettingId> = 
  Extract<(typeof settings)[number], { id: T }> extends { initialValue: infer U } ? U : never;

type SettingsValues = {
  [K in SettingId]: SettingValueType<K>;
};

type SettingsState = {
  settingsConfig: SettingType[];
  settingsCategories: SettingCategory[];
  setSetting: (settingId: string, value: string | boolean) => void;
  getSetting: <T extends string | boolean>(settingId: string) => T;
} & SettingsValues;

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
        getSetting: (settingId) => get()[settingId] as any,
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
