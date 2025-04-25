import { useSettingsStore } from "@/store/settingsStore";
import { usePressedKeys } from "./KeyPressContext";
import type { CommandId } from "@/store/settingsConfig";

interface KeybindingProps {
  /** The command ID whose first shortcut will be displayed (optional if combo provided) */
  command?: CommandId;
  /** A specific combo string (e.g., "Ctrl+C"). Overrides command if provided */
  combo?: string;
}

/**
 * Displays a keyboard shortcut as styled <kbd> elements for a given command or custom combo string.
 *
 * If a {@link combo} prop is provided, it is used as the shortcut; otherwise, the first keybinding for the {@link command} is displayed. Each key in the shortcut is rendered as a separate <kbd> element, visually indicating if it is currently pressed.
 *
 * @param command - The command ID whose keybinding should be displayed, if {@link combo} is not provided.
 * @param combo - An explicit shortcut string (e.g., "Ctrl+S") to display instead of looking up a command.
 *
 * @returns The rendered keybinding as styled elements, or null if no shortcut is available.
 *
 * @remark If keybindings cannot be retrieved from the settings store, the component logs a warning and renders nothing.
 */
export function Keybinding({ command, combo: comboProvided }: KeybindingProps) {
  const pressed = usePressedKeys();
  // normalize aliases: ctrl->control, cmd->meta, opt->alt, esc->escape
  const normalizeKey = (key: string) => {
    const k = key.toLowerCase();
    switch (k) {
      case 'ctrl':
      case 'control':
        return 'control';
      case 'cmd':
      case 'command':
        return 'meta';
      case 'opt':
      case 'option':
        return 'alt';
      case 'esc':
        return 'escape';
      default:
        return k;
    }
  };
  
  // First call the hook to get the state
  const settingsState = useSettingsStore(state => state);

  // Then safely access the keybindings from the state
  let bindings: Record<string, string[]> | undefined;
  try {
    bindings = settingsState.getSetting("keybindings") as Record<string, string[]>;
  } catch (error) {
    console.warn("Failed to get keybindings from store:", error);
    bindings = {};
  }
  
  const comboStr = comboProvided ?? (command && bindings ? bindings[command]?.[0] : "") ?? "";
  if (!comboStr) return null;
  const parts = comboStr.split("+");
  return (
    <div className="inline-flex items-center gap-1">
      {parts.map((part, i) => {
        const keyName = normalizeKey(part);
        const isDown = pressed.has(keyName);
        return (
          <kbd
            key={i}
            className={
              `pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar border-b-4 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground transition-all duration-75 ${
                isDown ? 'scale-90 border-b-0 border-t-2 brightness-75' : ''
              }`
            }
          >
            {part}
          </kbd>
        );
      })}
    </div>
  );
}
