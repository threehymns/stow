import { Sun, Moon, Monitor, Calendar, Layout, Eye, Palette } from "lucide-react";
import type { SettingCategory, SettingType } from "@/types/settings";
import { themes } from "@/lib/themes";

/** Categories metadata */
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

/** Settings metadata */
export const settings: SettingType[] = [
  {
    name: "Theme Mode",
    id: "theme",
    type: "select",
    initialValue: "system",
    icon: Sun,
    options: [
      { value: "light", icon: Sun },
      { value: "dark", icon: Moon },
      { value: "system", icon: Monitor },
    ],
    category: "appearance",
    description: "Control light or dark mode",
  },
  {
    name: "Color Theme",
    id: "colorTheme",
    type: "select",
    initialValue: "default",
    icon: Palette,
    options: themes.map((theme) => theme.id),
    category: "appearance",
    description: "Choose your preferred color palette",
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

/** Grouped settings type */
export interface GroupedSettings {
  [categoryId: string]: {
    _category?: SettingCategory;
    settings?: SettingType[];
    _subcategories: {
      [subcategoryId: string]: SettingType[];
    };
  };
}

/** Helper: Group settings by category and subcategory */
export function getGroupedSettings(): GroupedSettings {
  return settings.reduce<GroupedSettings>((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = {
        _category: settingsCategories.find((cat) => cat.id === setting.category),
        _subcategories: {},
      };
    }

    if (setting.subcategory) {
      if (!acc[setting.category]._subcategories[setting.subcategory]) {
        acc[setting.category]._subcategories[setting.subcategory] = [];
      }
      acc[setting.category]._subcategories[setting.subcategory].push(setting);
    } else {
      if (!acc[setting.category].settings) {
        acc[setting.category].settings = [];
      }
      acc[setting.category].settings.push(setting);
    }

    return acc;
  }, {});
}

/** Helper: Get all setting IDs for persistence */
export function getPersistenceKeys(): string[] {
  return settings.map((s) => s.id);
}