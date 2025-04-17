import React, { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import useSettingsStore from "./settingsStore";
import { 
  fetchUserSettings, 
  insertDefaultUserSettings, 
  updateUserSettingsWithVersion 
} from "@/integrations/supabase/userSettingsApi";

export const clientId = globalThis.crypto.randomUUID(); // unique per session

// Shallow equality for settings
function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>) {
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every(k => a[k] === b[k]);
}

export function useSettingsSync() {
  const { user, loading } = useAuth();
  const rawState = useSettingsStore();
  const settings = React.useMemo(() => {
    const keys = Object.keys(rawState).filter(
      (key) => ["string", "boolean", "number"].includes(typeof rawState[key])
    );
    const result: Record<string, string | boolean | number> = {};
    keys.forEach((key) => {
      result[key] = rawState[key] as string | boolean | number;
    });
    return result;
  }, [rawState]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInitialSync = useRef(false);
  const isRemoteUpdate = useRef(false);

  const lastSyncedSettings = useRef<Record<string, string | number | boolean>>({});
  const lastVersion = useRef<number>(0);
  const lastClientId = useRef<string | null>(null);

  useEffect(() => {
    if (!loading && user?.id) {
      let canceled = false;

      (async () => {
        const remote = await fetchUserSettings(user.id);
        if (canceled) return;

        if (remote) {
          lastVersion.current = remote.version;
          lastClientId.current = remote.clientId ?? null;
          lastSyncedSettings.current = { ...remote.settings };
          useSettingsStore.setState(remote.settings as Partial<typeof rawState>);
        } else {
          // no remote: insert local settings
          await insertDefaultUserSettings(user.id, settings);
          lastVersion.current = 1;
          lastClientId.current = clientId;
          lastSyncedSettings.current = { ...settings };
        }

        didInitialSync.current = true;
      })();

      return () => { canceled = true; };
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user?.id || !didInitialSync.current) return;

    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (shallowEqual(settings, lastSyncedSettings.current)) return;

      try {
        const success = await updateUserSettingsWithVersion(
          user.id,
          settings,
          lastVersion.current,
          clientId
        );
        if (success) {
          lastVersion.current += 1;
          lastClientId.current = clientId;
          lastSyncedSettings.current = { ...settings };
        } else {
          console.warn("[useSettingsSync] Version conflict on upload, refetching remote");
          // re-fetch remote settings
          const remote2 = await fetchUserSettings(user.id);
          if (remote2) {
            lastVersion.current = remote2.version;
            lastClientId.current = remote2.clientId ?? null;
            lastSyncedSettings.current = { ...remote2.settings };
            useSettingsStore.setState(remote2.settings as Partial<typeof rawState>);
          }
        }
      } catch (err) {
        console.error("[useSettingsSync] Upload failed", err);
      }
    }, 500);

    return () => clearTimeout(debounceRef.current!);
  }, [user?.id, settings]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(`settings-changes-${user.id}`);
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'settings', filter: `user_id=eq.${user.id}` },
      (payload: unknown) => {
        const change = payload as { new: { settings: Record<string, unknown>; version: number; client_id: string | null } };
        if (change.new.client_id === clientId) return; // ignore own events

        isRemoteUpdate.current = true;
        lastVersion.current = change.new.version;
        lastClientId.current = change.new.client_id;
        lastSyncedSettings.current = change.new.settings as Record<string, string | number | boolean>;
        useSettingsStore.setState(change.new.settings as Partial<typeof rawState>);
      }
    );
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);
}