import { create } from "zustand";
import type { UserSettingsWithMeta } from "@/integrations/supabase/userSettingsApi";
import { persist } from "zustand/middleware";
import type { SettingCategory, SettingType } from "../types/settings";
import { settings, settingsCategories, getPersistenceKeys } from "./settingsConfig";
import { fetchUserSettings, insertDefaultUserSettings, updateUserSettings } from "@/integrations/supabase/userSettingsApi";

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
  syncUserSettings: (userId: string) => Promise<UserSettingsWithMeta | null>;
  updateUserSettingsRemote: (userId: string) => Promise<void>;
} & SettingsValues;

function extractSettings(state: SettingsState): Record<string, string | boolean> {
  const keys = getPersistenceKeys();
  const result: Record<string, string | boolean> = {};
  keys.forEach((key) => {
    result[key] = state[key];
  });
  return result;
}

let debounceTimeout: NodeJS.Timeout | null = null;

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
        async syncUserSettings(userId: string): Promise<UserSettingsWithMeta | null> {
          console.log('[syncUserSettings] called with userId:', userId);
          try {
            const remote = await fetchUserSettings(userId);
            console.log('[syncUserSettings] fetchUserSettings returned:', remote);
            if (remote) {
              console.log('[syncUserSettings] Remote settings found, updating local state');
              // Overwrite local state with remote settings
              set(() => ({ ...(remote.settings as Partial<SettingsState>) }));
              return remote;
            } else {
              console.log('[syncUserSettings] No remote settings found, inserting defaults');
              // Insert defaults from current local state
              const defaults = extractSettings(get() as SettingsState);
              console.log('[syncUserSettings] Defaults to insert:', defaults);
              await insertDefaultUserSettings(userId, defaults);
              return null;
            }
          } catch (error) {
            console.error("Failed to sync user settings:", error);
            return null;
          }
        },
        setSetting: (settingId, value) => {
          set(() => ({ [settingId]: value }));
        },

        async updateUserSettingsRemote(userId: string) {
          console.log('[updateUserSettingsRemote] called with userId:', userId);
          try {
            const currentSettings = extractSettings(get() as SettingsState);
            console.log('[updateUserSettingsRemote] currentSettings:', currentSettings);
            await updateUserSettings(userId, currentSettings);
          } catch (error) {
            console.error("Failed to update user settings remotely:", error);
          }
        },
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
