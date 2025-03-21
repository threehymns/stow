import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Sun, Moon, Monitor, Calendar, LucideIcon } from "lucide-react";
import { SettingType } from "../types/settings";

export const settings: SettingType[] = [
  {
    name: "Theme",
    id: "theme",
    type: "select",
    initialValue: "system",
    icon: Sun,
    options: ["light", "dark", "system"],
  },
  {
    name: "Show Note Dates",
    id: "showNoteDates",
    type: "toggle",
    initialValue: true,
    icon: Calendar,
  },
];

type SettingsState = {
  settingsConfig: SettingType[];
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
        setSetting: (settingId, value) =>
          set((state) => {
            return { [settingId]: value };
          }),
        getSetting: (settingId) => get()[settingId],
      } as SettingsState;
    },
    {
      name: "settings-storage",
    },
  ),
);

export default useSettingsStore;
