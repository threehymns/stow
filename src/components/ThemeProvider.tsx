
"use client";

import { useEffect } from "react";
import useSettingsStore from "@/store/settingsStore";
import { getThemeById } from "@/lib/themes";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const settingsStore = useSettingsStore();
  const theme = settingsStore.theme;
  const colorTheme = settingsStore.colorTheme;

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove existing classes
    root.classList.remove("light", "dark");

    // Determine light/dark mode
    let mode = theme;
    if (theme === "system") {
      mode = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    // Add the appropriate class
    root.classList.add(mode);

    // Apply the selected color theme
    const selectedTheme = getThemeById(colorTheme);
    const themeColors =
      mode === "dark" ? selectedTheme.dark : selectedTheme.light;

    // Apply all theme colors as CSS variables
    Object.entries(themeColors).forEach(([property, value]) => {
      root.style.setProperty(`--${property}`, value as string);
    });
  }, [theme, colorTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      const root = window.document.documentElement;
      const mode = mediaQuery.matches ? "dark" : "light";

      // Update class
      root.classList.remove("light", "dark");
      root.classList.add(mode);

      // Apply theme colors
      const selectedTheme = getThemeById(colorTheme);
      const themeColors =
        mode === "dark" ? selectedTheme.dark : selectedTheme.light;

      // Apply all theme colors as CSS variables
      Object.entries(themeColors).forEach(([property, value]) => {
        root.style.setProperty(`--${property}`, value as string);
      });
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, colorTheme]);

  return <>{children}</>;
}
