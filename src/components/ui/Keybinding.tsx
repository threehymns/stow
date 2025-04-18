import { useSettingsStore } from "@/store/settingsStore";
import type { CommandId } from "@/store/settingsConfig";

interface KeybindingProps {
  /** The command ID whose first shortcut will be displayed (optional if combo provided) */
  command?: CommandId;
  /** A specific combo string (e.g., "Ctrl+C"). Overrides command if provided */
  combo?: string;
}

/**
 * Renders the first keybinding for a command as styled <kbd> elements.
 */
export function Keybinding({ command, combo: comboProvided }: KeybindingProps) {
  const bindings = useSettingsStore(
    state => state.getSetting("keybindings") as Record<string, string[]>
  );
  const comboStr = comboProvided
    ? comboProvided
    : command
    ? bindings[command]?.[0] || ""
    : "";
  // nothing to render
  if (!comboStr) return null;
  const parts = comboStr.split("+");
  return (
    <div className="inline-flex items-center gap-1">
      {parts.map((part, i) => (
          <kbd
            key={i}
            className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar border-b-4 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"
          >
            {part}
          </kbd>
      ))}
    </div>
  );
}
