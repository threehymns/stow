import { useEffect, useRef } from 'react';
import type { CommandId } from '@/store/settingsConfig';

// Simple, type-safe command center without external dependencies
// Handlers receive an optional payload
type Handler = (payload?: any) => void;
const handlers: Partial<Record<CommandId, Handler[]>> = {};

const commandCenter = {
  on(event: CommandId, handler: Handler) {
    if (!handlers[event]) handlers[event] = [];
    handlers[event]!.push(handler);
  },
  off(event: CommandId, handler: Handler) {
    handlers[event] = handlers[event]?.filter(h => h !== handler) || [];
  },
  emit(event: CommandId, payload?: any) {
    handlers[event]?.slice().forEach(h => h(payload));
  },
};

/**
 * React hook to subscribe to a commandCenter event with automatic cleanup.
 * @param command - The CommandId to listen for
 * @param handler - Callback invoked when the command is emitted
 */
export function useCommand(
  command: CommandId,
  handler: (payload?: any) => void
) {
  const savedHandler = useRef(handler);
  // update ref if handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  useEffect(() => {
    const listener = (payload?: any) => savedHandler.current(payload);
    commandCenter.on(command, listener);
    return () => {
      commandCenter.off(command, listener);
    };
  }, [command]);
}

export default commandCenter;
