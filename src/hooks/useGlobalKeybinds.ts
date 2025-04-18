import { useEffect } from "react";
import { settings as settingsDefinitions } from "@/store/settingsConfig";
import { useSettingsStore } from "@/store/settingsStore";
import commandCenter from "@/hooks/commandCenter";

/**
 * Register all keybindings from settingsConfig to emit commandCenter events.
 * Pressing any configured key combo emits its action ID message.
 */
export function useGlobalKeybinds() {
  const keybindings = useSettingsStore(
    (state) => state.getSetting("keybindings") as Record<string, string[]>
  );

  useEffect(() => {
    const defs = settingsDefinitions.find(
      (s): s is Extract<typeof settingsDefinitions[number], { type: 'keybindings' }> =>
        s.id === 'keybindings' && s.type === 'keybindings'
    );
    if (!defs) return;

    // Collect listeners for cleanup
    const listeners: ((e: KeyboardEvent) => void)[] = [];

    defs.actions.forEach((action) => {
      const combos = keybindings[action.id] || [];
      combos.forEach((combo) => {
        const parts = combo.toLowerCase().split('+');
        const handler = (e: KeyboardEvent) => {
          if (parts.includes('ctrl') !== e.ctrlKey) return;
          if (parts.includes('shift') !== e.shiftKey) return;
          if (parts.includes('alt') !== e.altKey) return;
          if (parts.includes('meta') !== e.metaKey) return;
          const key = parts.find(
            (p) => !['ctrl', 'shift', 'alt', 'meta'].includes(p)
          );
          if (e.key.toLowerCase() === key) {
            e.preventDefault();
            commandCenter.emit(action.id);
          }
        };
        document.addEventListener('keydown', handler);
        listeners.push(handler);
      });
    });

    return () => {
      listeners.forEach((handler) => {
        document.removeEventListener('keydown', handler);
      });
    };
  }, [keybindings]);
}
