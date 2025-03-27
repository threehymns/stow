import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ThemeColors = {
  background: string;
  foreground: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  muted: string;
  "muted-foreground": string;
  accent: string;
  "accent-foreground": string;
  destructive: string;
  "destructive-foreground": string;
  border: string;
  input: string;
  ring: string;
  "sidebar-background": string;
  "sidebar-foreground": string;
  "sidebar-primary": string;
  "sidebar-primary-foreground": string;
  "sidebar-accent": string;
  "sidebar-accent-foreground": string;
  "sidebar-border": string;
  "sidebar-ring": string;
};

export type Theme = {
  name: string;
  id: string;
  light: ThemeColors;
  dark: ThemeColors;
};

// Default theme (already in index.css)
export const defaultTheme: Theme = {
  name: "Default",
  id: "default",
  light: {
    background: "0 0% 100%",
    foreground: "240 10% 3.9%",
    card: "0 0% 100%",
    "card-foreground": "240 10% 3.9%",
    popover: "0 0% 100%",
    "popover-foreground": "240 10% 3.9%",
    primary: "240 5.9% 10%",
    "primary-foreground": "0 0% 98%",
    secondary: "240 4.8% 95.9%",
    "secondary-foreground": "240 5.9% 10%",
    muted: "240 4.8% 95.9%",
    "muted-foreground": "240 3.8% 46.1%",
    accent: "240 4.8% 95.9%",
    "accent-foreground": "240 5.9% 10%",
    destructive: "0 84.2% 60.2%",
    "destructive-foreground": "0 0% 98%",
    border: "240 5.9% 90%",
    input: "240 5.9% 90%",
    ring: "240 5.9% 10%",
    "sidebar-background": "240 4.8% 98%",
    "sidebar-foreground": "240 10% 3.9%",
    "sidebar-primary": "240 5.9% 10%",
    "sidebar-primary-foreground": "0 0% 98%",
    "sidebar-accent": "240 4.8% 95.9%",
    "sidebar-accent-foreground": "240 5.9% 10%",
    "sidebar-border": "240 5.9% 90%",
    "sidebar-ring": "240 5.9% 10%",
  },
  dark: {
    background: "240 10% 3.9%",
    foreground: "0 0% 98%",
    card: "240 10% 3.9%",
    "card-foreground": "0 0% 98%",
    popover: "240 10% 3.9%",
    "popover-foreground": "0 0% 98%",
    primary: "0 0% 98%",
    "primary-foreground": "240 5.9% 10%",
    secondary: "240 3.7% 15.9%",
    "secondary-foreground": "0 0% 98%",
    muted: "240 3.7% 15.9%",
    "muted-foreground": "240 5% 64.9%",
    accent: "240 3.7% 15.9%",
    "accent-foreground": "0 0% 98%",
    destructive: "0 62.8% 30.6%",
    "destructive-foreground": "0 0% 98%",
    border: "240 3.7% 15.9%",
    input: "240 3.7% 15.9%",
    ring: "240 4.9% 83.9%",
    "sidebar-background": "240 3.7% 10%",
    "sidebar-foreground": "0 0% 98%",
    "sidebar-primary": "0 0% 98%",
    "sidebar-primary-foreground": "240 5.9% 10%",
    "sidebar-accent": "240 3.7% 15.9%",
    "sidebar-accent-foreground": "0 0% 98%",
    "sidebar-border": "240 3.7% 15.9%",
    "sidebar-ring": "240 4.9% 83.9%",
  },
};

// Catppuccin theme
export const catppuccinTheme: Theme = {
  name: "Catppuccin",
  id: "catppuccin",
  light: {
    // Catppuccin Latte
    background: "220 23% 95%",
    foreground: "234 16% 35%",
    card: "220 23% 95%",
    "card-foreground": "234 16% 35%",
    popover: "220 23% 95%",
    "popover-foreground": "234 16% 35%",
    primary: "220 91% 54%",
    "primary-foreground": "220 23% 95%",
    secondary: "234 16% 35%",
    "secondary-foreground": "220 23% 95%",
    muted: "220 14% 88%",
    "muted-foreground": "234 10% 50%",
    accent: "343, 81%, 75%",
    "accent-foreground": "234 16% 35%",
    destructive: "0 84% 60%",
    "destructive-foreground": "220 23% 95%",
    border: "220 14% 88%",
    input: "220 14% 88%",
    ring: "220 91% 54%",
    "sidebar-background": "220deg, 22%, 92%",
    "sidebar-foreground": "234 16% 35%",
    "sidebar-primary": "220 91% 54%",
    "sidebar-primary-foreground": "220 23% 95%",
    "sidebar-accent": "220 23% 95%",
    "sidebar-accent-foreground": "234 16% 35%",
    "sidebar-border": "220 14% 88%",
    "sidebar-ring": "220 91% 54%",
  },
  dark: {
    // Catppuccin Mocha
    background: "240 21% 15%",
    foreground: "226 64% 88%",
    card: "240 21% 15%",
    "card-foreground": "226 64% 88%",
    popover: "240 21% 15%",
    "popover-foreground": "226 64% 88%",
    primary: "203 76% 86%",
    "primary-foreground": "240 21% 15%",
    secondary: "240 24% 25%",
    "secondary-foreground": "226 64% 88%",
    muted: "240 24% 25%",
    "muted-foreground": "226 40% 70%",
    accent: "316 72% 69%",
    "accent-foreground": "240 21% 15%",
    destructive: "0 62.8% 30.6%",
    "destructive-foreground": "226 64% 88%",
    border: "240 24% 25%",
    input: "240 24% 25%",
    ring: "203 76% 86%",
    "sidebar-background": "240 21% 12%",
    "sidebar-foreground": "226 64% 88%",
    "sidebar-primary": "203 76% 86%",
    "sidebar-primary-foreground": "240 21% 15%",
    "sidebar-accent": "240, 21%, 15%",
    "sidebar-accent-foreground": "240 21% 15%",
    "sidebar-border": "240 24% 25%",
    "sidebar-ring": "203 76% 86%",
  },
};

// Nord theme
export const nordTheme: Theme = {
  name: "Nord",
  id: "nord",
  light: {
    background: "218 27% 92%",
    foreground: "220 16% 22%",
    card: "218 27% 92%",
    "card-foreground": "220 16% 22%",
    popover: "219 28% 88%",
    "popover-foreground": "220 16% 22%",
    primary: "210 34% 63%",
    "primary-foreground": "219 28% 88%",
    secondary: "220 16% 36%",
    "secondary-foreground": "219 28% 88%",
    muted: "193 42% 67%",
    "muted-foreground": "220 16% 46%",
    accent: "193 43% 67%",
    "accent-foreground": "220 16% 22%",
    destructive: "354 42% 56%",
    "destructive-foreground": "219 28% 88%",
    border: "219 28% 88%",
    input: "219 28% 88%",
    ring: "210 34% 63%",
    "sidebar-background": "218 27% 92%",
    "sidebar-foreground": "220 16% 22%",
    "sidebar-primary": "210 34% 63%",
    "sidebar-primary-foreground": "219 28% 88%",
    "sidebar-accent": "219 28% 88%",
    "sidebar-accent-foreground": "220 16% 22%",
    "sidebar-border": "218 20% 88%",
    "sidebar-ring": "210 34% 63%",
  },
  dark: {
    background: "220 16% 22%",
    foreground: "218 27% 92%",
    card: "220 16% 22%",
    "card-foreground": "218 27% 92%",
    popover: "220 16% 22%",
    "popover-foreground": "218 27% 92%",
    primary: "210 34% 63%",
    "primary-foreground": "220 16% 22%",
    secondary: "220 16% 36%",
    "secondary-foreground": "218 27% 92%",
    muted: "220 16% 36%",
    "muted-foreground": "218 10% 70%",
    accent: "193 43% 67%",
    "accent-foreground": "220 16% 22%",
    destructive: "354 42% 56%",
    "destructive-foreground": "218 27% 92%",
    border: "220 16% 36%",
    input: "220 16% 36%",
    ring: "210 34% 63%",
    "sidebar-background": "220 16% 28%",
    "sidebar-foreground": "218 27% 92%",
    "sidebar-primary": "210 34% 63%",
    "sidebar-primary-foreground": "220 16% 22%",
    "sidebar-accent": "220 17% 32%",
    "sidebar-accent-foreground": "220 16% 22%",
    "sidebar-border": "220 16% 36%",
    "sidebar-ring": "210 34% 63%",
  },
};

// Tokyo Night theme
export const tokyoNightTheme: Theme = {
  name: "Tokyo Night",
  id: "tokyo-night",
  light: {
    // Tokyo Night Day
    background: "210 20% 98%",
    foreground: "220 10% 23%",
    card: "210 20% 98%",
    "card-foreground": "220 10% 23%",
    popover: "210 20% 98%",
    "popover-foreground": "220 10% 23%",
    primary: "230 55% 60%",
    "primary-foreground": "210 20% 98%",
    secondary: "220 14% 90%",
    "secondary-foreground": "220 10% 23%",
    muted: "220 14% 90%",
    "muted-foreground": "220 10% 46%",
    accent: "340 82% 76%",
    "accent-foreground": "220 10% 23%",
    destructive: "0 60% 54%",
    "destructive-foreground": "210 20% 98%",
    border: "220 14% 90%",
    input: "220 14% 90%",
    ring: "230 55% 60%",
    "sidebar-background": "210 20% 98%",
    "sidebar-foreground": "220 10% 23%",
    "sidebar-primary": "230 55% 60%",
    "sidebar-primary-foreground": "210 20% 98%",
    "sidebar-accent": "340 82% 76%",
    "sidebar-accent-foreground": "220 10% 23%",
    "sidebar-border": "220 14% 90%",
    "sidebar-ring": "230 55% 60%",
  },
  dark: {
    // Tokyo Night Storm
    background: "225 27% 15%",
    foreground: "216 33% 97%",
    card: "225 27% 15%",
    "card-foreground": "216 33% 97%",
    popover: "225 27% 15%",
    "popover-foreground": "216 33% 97%",
    primary: "230 66% 74%",
    "primary-foreground": "225 27% 15%",
    secondary: "225 23% 23%",
    "secondary-foreground": "216 33% 97%",
    muted: "225 23% 23%",
    "muted-foreground": "216 20% 70%",
    accent: "340 82% 76%",
    "accent-foreground": "225 27% 15%",
    destructive: "0 63% 47%",
    "destructive-foreground": "216 33% 97%",
    border: "225 23% 23%",
    input: "225 23% 23%",
    ring: "230 66% 74%",
    "sidebar-background": "225 27% 12%",
    "sidebar-foreground": "216 33% 97%",
    "sidebar-primary": "230 66% 74%",
    "sidebar-primary-foreground": "225 27% 15%",
    "sidebar-accent": "230 24% 19%",
    "sidebar-accent-foreground": "225 27% 15%",
    "sidebar-border": "225 23% 23%",
    "sidebar-ring": "230 66% 74%",
  },
};

// All available themes
export const themes: Theme[] = [
  defaultTheme,
  catppuccinTheme,
  nordTheme,
  tokyoNightTheme,
];

// Helper function to get a theme by ID
export function getThemeById(id: string): Theme {
  return themes.find((theme) => theme.id === id) || defaultTheme;
}