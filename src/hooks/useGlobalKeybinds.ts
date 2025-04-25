import { useEffect } from "react";
import { settings } from "@/store/settingsConfig";
import { useSettingsStore } from "@/store/settingsStore";
import commandCenter from "@/hooks/commandCenter";

/**
 * Registers global keyboard shortcuts based on user settings and emits corresponding command events.
 *
 * Sets up keydown listeners for all configured keybindings. When a registered key combination is pressed, the associated action ID is emitted through the command center.
 *
 * @remark Listeners are automatically cleaned up when keybindings change or the component unmounts.
 */
export function useGlobalKeybinds() {
  const keybindings = useSettingsStore(
    (state) => state.getSetting("keybindings") as Record<string, string[]>
  );

  useEffect(() => {
    // Guard against undefined keybindings during initialization
    if (!keybindings) {
      console.warn("Keybindings not yet loaded");
      return;
    }
    
    const keybindingsSetting = settings.find(
      (s) => s.id === 'keybindings' && s.type === 'keybindings'
    );
    
    if (!keybindingsSetting) return;

    // Collect listeners for cleanup
    const listeners: ((e: KeyboardEvent) => void)[] = [];

    keybindingsSetting.actions.forEach((action) => {
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
