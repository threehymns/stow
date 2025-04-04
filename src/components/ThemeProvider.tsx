
import { createContext, useContext, useEffect, useState } from "react";
import { useSettingsStore } from "@/store/settingsStore";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  systemTheme: Theme;
  getSetting: <T extends string | boolean>(key: string) => T;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  systemTheme: "light",
  getSetting: () => "" as any,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const { getSetting } = useSettingsStore();
  const [theme, setTheme] = useState<Theme>(
    () => (getSetting("theme") as Theme) || defaultTheme
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
    const storedTheme = getSetting("theme") as Theme;
    const resolvedTheme = storedTheme || defaultTheme;

    setTheme(resolvedTheme);

    const isDark =
      resolvedTheme === "dark" ||
      (resolvedTheme === "system" && systemTheme === "dark");

    root.classList.toggle("dark", isDark);
  }, [systemTheme, defaultTheme, getSetting]);

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
