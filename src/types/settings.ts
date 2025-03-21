import { LucideIcon } from "lucide-react";

type BaseSettingType = {
  name: string;
  id: string;
  icon: LucideIcon;
};

export type SettingType =
  | (BaseSettingType & {
      type: "select";
      options: string[];
      initialValue: string;
    })
  | (BaseSettingType & {
      type: "toggle";
      initialValue: boolean;
      icon: LucideIcon;
    });
