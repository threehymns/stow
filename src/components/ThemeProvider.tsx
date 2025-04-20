import { createContext, useContext, useEffect, useState } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { getThemeById } from "@/lib/themes";
import { settings } from "@/store/settingsConfig";
import type { SettingType } from "@/types/settings";

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

  // Dynamic font loading for UI and editor
  const uiFont = useSettingsStore(s => s.getSetting<string>("uiFont") as string);
  const editorFont = useSettingsStore(s => s.getSetting<string>("editorFont") as string);

  useEffect(() => {
    const root = document.documentElement;
    const nonVariableFonts = new Set(['fira-sans', 'titillium-web']);
    const unicodeRange = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";

    const fontConfigs: Array<{ fontValue: string; settingId: 'uiFont' | 'editorFont'; styleId: string; cssVar: string; fallback: string; }> = [
      { fontValue: uiFont, settingId: 'uiFont', styleId: 'font-ui', cssVar: '--font-ui', fallback: 'system-ui, sans-serif' },
      { fontValue: editorFont, settingId: 'editorFont', styleId: 'font-editor', cssVar: '--font-editor', fallback: 'sans-serif, sans-serif' },
    ];

    fontConfigs.forEach(({ fontValue, settingId, styleId, cssVar, fallback }) => {
      document.getElementById(styleId)?.remove();
      if (fontValue === 'system-ui') {
        root.style.setProperty(cssVar, fallback);
        return;
      }
      const setting = settings.find(
        (s): s is Extract<SettingType, { type: 'select' }> =>
          s.id === settingId && s.type === 'select'
      );
      const opt = setting?.options.find(
        (o): o is { value: string; label: string } =>
          typeof o !== 'string' && o.value === fontValue
      );
      if (!opt) {
        root.style.setProperty(cssVar, fallback);
        return;
      }
      const slug = opt.value;
      const label = opt.label;
      const isVariableFont = !nonVariableFonts.has(slug);
      const styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.textContent = `
        @font-face {
          font-family: '${label}${isVariableFont ? ' Variable' : ''}';
          font-style: normal;
          font-display: swap;
          font-weight: ${isVariableFont ? '100 900' : '400'};
          src: url(https://cdn.jsdelivr.net/fontsource/fonts/${slug}${isVariableFont ? ':vf@latest' : '@latest'}/${isVariableFont ? 'latin-wght-normal.woff2' : 'latin-400-normal.woff2'}) format('${isVariableFont ? 'woff2-variations' : 'woff2'}');
          unicode-range: ${unicodeRange};
        }
      `;
      root.style.setProperty(cssVar,
        `'${label}${isVariableFont ? ' Variable' : ''}', sans-serif`
      );
      document.head.appendChild(styleTag);
    });
  }, [uiFont, editorFont]);

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
