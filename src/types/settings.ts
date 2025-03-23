
import { LucideIcon } from "lucide-react";

export type SettingCategory = {
  id: string;
  name: string;
  description?: string;
  icon?: LucideIcon;
};

type BaseSettingType = {
  name: string;
  id: string;
  description?: string;
  category: string;
  subcategory?: string;
};

export type SettingType =
  | (BaseSettingType & {
      type: "select";
      options: string[];
      initialValue: string;
      icon?: LucideIcon;
    })
  | (BaseSettingType & {
      type: "toggle";
      initialValue: boolean;
      icon?: LucideIcon;
    });
