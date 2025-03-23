
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Sun, Moon, Monitor, Calendar, Settings, Layout, Eye } from "lucide-react";
import { SettingCategory, SettingType } from "../types/settings";

export const settingsCategories: SettingCategory[] = [
  {
    id: "appearance",
    name: "Appearance",
    description: "Customize how the application looks",
    icon: Layout,
  },
  {
    id: "display",
    name: "Display",
    description: "Control what information is displayed",
    icon: Eye,
  },
];

export const settings: SettingType[] = [
  {
    name: "Theme",
    id: "theme",
    type: "select",
    initialValue: "system",
    icon: Sun,
    options: ["light", "dark", "system"],
    category: "appearance",
    description: "Control the application's color theme",
  },
  {
    name: "Show Note Dates",
    id: "showNoteDates",
    type: "toggle",
    initialValue: true,
    icon: Calendar,
    category: "display",
    description: "Show creation dates under note titles in the sidebar",
  },
];

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
