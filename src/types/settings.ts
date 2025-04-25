
import { LucideIcon } from "lucide-react";

export type SettingCategory = {
  id: string;
  name: string;
  description?: string;
  icon?: LucideIcon;
};

type BaseSettingType = {
  name?: string;
  label?: string;
  id: string;
  description?: string;
  category?: string;
  subcategory?: string;
};

export type SettingType =
  | (BaseSettingType & {
      type: "select";
      name: string;
      options: Array<string | { value: string; label?: string; icon?: LucideIcon }>;
      initialValue: string;
      icon?: LucideIcon;
      category: string;
    })
  | (BaseSettingType & {
      type: "toggle";
      name: string;
      initialValue: boolean;
      icon?: LucideIcon;
      category: string;
    })
  | (BaseSettingType & {
      type: "keybindings";
      label: string;
      initialValue: Record<string, string[]>;
      actions: Array<{ 
        id: string; 
        label: string;
        description?: string;
        defaultValue: string[];
      }>;
    });
