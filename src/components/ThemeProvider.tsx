
import { createContext, useContext, useEffect, useState } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { getThemeById } from "@/lib/themes";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: string;
  setTheme: (theme: Theme) => void;
  systemTheme: Theme;
  getSetting: (key: string) => string | boolean | number;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  systemTheme: "light",
  getSetting: () => "" as string,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const themeMode = useSettingsStore(state => state.getSetting<Theme>("theme"));
  const colorTheme = useSettingsStore(state => state.getSetting<string>("colorTheme"));
  const getSetting = useSettingsStore(state => state.getSetting);
  const [theme, setTheme] = useState<Theme>(
    () => (getSetting<Theme>("theme")) || defaultTheme
  );
  const [systemTheme, setSystemTheme] = useState<Theme>(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const resolvedTheme = themeMode || defaultTheme;

    if (theme !== resolvedTheme) {
      setTheme(resolvedTheme);
    }

    const isDark =
      resolvedTheme === "dark" ||
      (resolvedTheme === "system" && systemTheme === "dark");

    root.classList.toggle("dark", isDark);

    if (colorTheme) {
      root.setAttribute("data-color-theme", colorTheme);
    } else {
      root.removeAttribute("data-color-theme");
    }
    // Update CSS variables for the selected color theme
    const themeObj = getThemeById(colorTheme);
    const palette = isDark ? themeObj.dark : themeObj.light;

    Object.entries(palette).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }, [systemTheme, defaultTheme, themeMode, colorTheme]);

  const value = {
    theme,
    setTheme,
    systemTheme,
    getSetting,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
