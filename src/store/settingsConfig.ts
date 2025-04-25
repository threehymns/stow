import { Sun, Moon, Monitor, Calendar, Layout, Eye, Palette, Keyboard, SortAsc } from "lucide-react";
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
  {
    id: "shortcuts",
    name: "Shortcuts",
    description: "Customize keyboard shortcuts",
    icon: Keyboard,
  },
];

/** Settings metadata */
export const settings = [
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
    options: themes.map((theme) => ({ value: theme.id, label: theme.name })),
    category: "appearance",
    description: "Choose your preferred color palette",
  },
  {
    name: "UI Font",
    id: "uiFont",
    type: "select",
    initialValue: "inter",
    icon: undefined,
    options: [
      { value: "system-ui", label: "System UI" },
      { value: "inter", label: "Inter" },
      { value: "geist", label: "Geist" },
      { value: "sora", label: "Sora" },
      { value: "rubik", label: "Rubik" },
      { value: "shantell-sans", label: "Shantell Sans" },
      { value: "roboto", label: "Roboto" },
      { value: "titillium-web", label: "Titillium Web" },
      { value: "fira-sans", label: "Fira Sans" },
      { value: "roboto-slab", label: "Roboto Slab" },
      { value: "playfair-display", label: "Playfair Display" },
      { value: "lora", label: "Lora" },
      { value: "fira-code", label: "Fira Code" },
      { value: "source-code-pro", label: "Source Code Pro" },
      { value: "exo-2", label: "Exo 2" },
      { value: "space-grotesk", label: "Space Grotesk" },
    ],
    category: "appearance",
    description: "Select font for UI elements",
  },
  {
    name: "Editor Font",
    id: "editorFont",
    type: "select",
    initialValue: "system-ui",
    icon: undefined,
    options: [
      { value: "system-ui", label: "System UI" },
      { value: "inter", label: "Inter" },
      { value: "geist", label: "Geist" },
      { value: "sora", label: "Sora" },
      { value: "rubik", label: "Rubik" },
      { value: "shantell-sans", label: "Shantell Sans" },
      { value: "roboto", label: "Roboto" },
      { value: "titillium-web", label: "Titillium Web" },
      { value: "fira-sans", label: "Fira Sans" },
      { value: "roboto-slab", label: "Roboto Slab" },
      { value: "playfair-display", label: "Playfair Display" },
      { value: "lora", label: "Lora" },
      { value: "fira-code", label: "Fira Code" },
      { value: "source-code-pro", label: "Source Code Pro" },
      { value: "exo-2", label: "Exo 2" },
      { value: "space-grotesk", label: "Space Grotesk" },
    ],
    category: "appearance",
    description: "Select font for editor",
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
  {
    id: 'keybindings',
    type: 'keybindings' as const,
    label: 'Keyboard Shortcuts',
    category: 'shortcuts',
    actions: [
      {
        id: 'newNote',
        label: 'New Note',
        description: 'Create a new note',
        defaultValue: ['Ctrl+Alt+N'],
      },
      {
        id: 'newFolder',
        label: 'New Folder',
        description: 'Create a new folder',
        defaultValue: ['Ctrl+Alt+F'],
      },
      {
        id: 'sync',
        label: 'Sync Notes',
        description: 'Sync notes with the server',
        defaultValue: ['Ctrl+S'],
      },
      {
        id: 'commandBar',
        label: 'Command Bar',
        description: 'Open the command bar',
        defaultValue: ['Ctrl+Shift+P'],
      },
      {
        id: 'openSettings',
        label: 'Open Settings',
        description: 'Open the settings dialog',
        defaultValue: ['Ctrl+,'],
      },
      {
        id: 'searchNotes',
        label: 'Search Notes',
        description: 'Open the search command dialog',
        defaultValue: ['Ctrl+K'],
      },
    ],
    initialValue: {
      newNote: ['Ctrl+Alt+N'],
      newFolder: ['Ctrl+Alt+F'],
      sync: ['Ctrl+S'],
      commandBar: ['Ctrl+Shift+P'],
      openSettings: ['Ctrl+,'],
      searchNotes: ['Ctrl+K'],
    }
  },
] as const;

// Infer CommandId union from keybindings action IDs
export type CommandId =
  Extract<
    typeof settings[number],
    { type: 'keybindings' }
  >['actions'][number]['id'];

/** Grouped settings type */
export interface GroupedSettings {
  [categoryId: string]: {
    _category?: SettingCategory;
    settings: SettingType[];
    _subcategories: {
      [subcategoryId: string]: SettingType[];
    };
  };
}

/**
 * Groups all settings by their category and subcategory.
 *
 * @returns An object mapping each category to its grouped settings and subcategories.
 */
export function getGroupedSettings(): GroupedSettings {
  return settings.reduce<GroupedSettings>((acc, setting) => {
    const categoryId = setting.category || 'uncategorized';
    
    if (!acc[categoryId]) {
      acc[categoryId] = {
        _category: settingsCategories.find((cat) => cat.id === categoryId),
        settings: [],
        _subcategories: {},
      };
    }

    if ('subcategory' in setting && setting.subcategory) {
      if (!acc[categoryId]._subcategories[setting.subcategory]) {
        acc[categoryId]._subcategories[setting.subcategory] = [];
      }
      acc[categoryId]._subcategories[setting.subcategory].push(setting as SettingType);
    } else {
      acc[categoryId].settings.push(setting as SettingType);
    }

    return acc;
  }, {});
}

/**
 * Returns an array of all setting IDs for use in persistence operations.
 *
 * @returns An array of setting identifier strings.
 */
export function getPersistenceKeys(): string[] {
  return settings.map((s) => s.id);
}
