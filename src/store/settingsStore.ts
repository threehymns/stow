import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SettingCategory, SettingType } from "../types/settings";
import { settings, settingsCategories, getPersistenceKeys } from "./settingsConfig";

type SettingId = (typeof settings)[number]["id"];

type SettingValueType<T extends SettingId> =
  Extract<(typeof settings)[number], { id: T }> extends { initialValue: infer U } ? U : never;

type SettingsValues = {
  [K in SettingId]: SettingValueType<K>;
};

type SettingsState = {
  settingsConfig: SettingType[];
  settingsCategories: SettingCategory[];
  setSetting: <T extends SettingId>(settingId: T, value: SettingValueType<T>) => void;
  getSetting: <T extends SettingId>(settingId: T) => SettingValueType<T>;
} & SettingsValues;

function extractSettings(state: SettingsState): Record<string, string | boolean> {
  const keys = getPersistenceKeys();
  const result: Record<string, string | boolean> = {};
  keys.forEach((key) => {
    result[key] = state[key];
  });
  return result;
}

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
        setSetting: <T extends SettingId>(settingId: T, value: SettingValueType<T>) => {
          set({ [settingId]: value } as Partial<SettingsState>);
        },

        getSetting: <T extends SettingId>(settingId: T) => get()[settingId] as SettingValueType<T>,
      } as SettingsState;
    },
    {
      name: "settings-storage",
      partialize: (state) => {
        const persisted: Record<string, unknown> = {};
        getPersistenceKeys().forEach((key) => {
          persisted[key] = state[key];
        });
        return persisted;
      },
    },
  ),
);

export default useSettingsStore;
