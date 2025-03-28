import type { Theme } from "@/lib/themes";
import useSettingsStore from "@/store/settingsStore";
import { cn } from "@/lib/utils";

interface ThemePreviewCircleProps {
  theme: Theme;
  className?: string;
  style?: React.CSSProperties;
}

export default function ThemePreviewCircle({
  theme,
  className,
  style,
}: ThemePreviewCircleProps) {
  const { theme: currentTheme } = useSettingsStore();
  const { background, accent, muted, primary, border } =
    currentTheme === "dark" ? theme.dark : theme.light;

  return (
    <div
      className={cn(
        "size-6 rounded-full mr-2 overflow-clip border-2 flex flex-wrap shadow-2xl",
        className,
      )}
      style={{
        backgroundColor: `hsl(${background})`,
        borderColor: `hsl(${border})`,
        ...style,
      }}
    >
      <div className="size-1/2" style={{ backgroundColor: `hsl(${accent})` }} />
      <div className="size-1/2" style={{ backgroundColor: `hsl(${muted})` }} />
      <div
        className="size-1/2"
        style={{ backgroundColor: `hsl(${primary})` }}
      />
    </div>
  );
}
