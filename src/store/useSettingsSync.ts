import React, { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import useSettingsStore from "./settingsStore";
import { fetchUserSettings, updateUserSettingsWithVersion } from "@/integrations/supabase/userSettingsApi";
import { v4 as uuidv4 } from "uuid";

export function useSettingsSync() {
  const { user, loading } = useAuth();
  const rawState = useSettingsStore();
  const settings = React.useMemo(() => {
    const keys = Object.keys(rawState).filter(
      (key) => typeof rawState[key] === "string" || typeof rawState[key] === "boolean"
    );
    const result: Record<string, string | boolean> = {};
    keys.forEach((key) => {
      result[key] = rawState[key];
    });
    return result;
  }, [rawState]);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const didInitialSync = useRef(false);
  const skipNextUpload = useRef(false);
  const skipNextFetch = useRef(false);
  const suppressNextUpload = useRef(false);

  const lastSyncedSettings = useRef<Record<string, string | number | boolean>>({});
  const lastVersion = useRef<number>(0);
  const lastClientId = useRef<string | null>(null);

  const clientId = useRef<string>(uuidv4());

  useEffect(() => {
    if (!loading && user?.id) {
      fetchUserSettings(user.id).then((remote) => {
        if (remote) {
          lastVersion.current = remote.version;
          lastClientId.current = remote.clientId ?? null;
          lastSyncedSettings.current = { ...remote.settings };
          useSettingsStore.setState(remote.settings as Partial<typeof rawState>);
        }
        didInitialSync.current = true;
      });
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user?.id) return;
    if (!didInitialSync.current) return;

    if (skipNextUpload.current) {
      console.log("[useSettingsSync] Skipping upload triggered by remote sync");
      skipNextUpload.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      if (suppressNextUpload.current) {
        console.log("[useSettingsSync] Suppressing upload triggered by remote update");
        suppressNextUpload.current = false;
        return;
      }

      const keys = new Set([...Object.keys(settings), ...Object.keys(lastSyncedSettings.current)]);
      let changed = false;
      for (const key of keys) {
        if (settings[key] !== lastSyncedSettings.current[key]) {
          changed = true;
          break;
        }
      }
      if (!changed) {
        console.log("[useSettingsSync] Settings unchanged from last sync, skipping upload");
        return;
      }

      console.log("[useSettingsSync] Detected local settings change, preparing to upload with version check...");

      try {
        const latest = await fetchUserSettings(user.id);
        if (!latest) {
          console.warn("[useSettingsSync] No remote settings found, aborting upload");
          return;
        }

        if (latest.version > lastVersion.current) {
          console.log("[useSettingsSync] Remote version is newer, merging changes");
          const merged: Record<string, string | number | boolean> = { ...latest.settings };

          for (const key of Object.keys(settings)) {
            const localVal = settings[key];
            const lastSyncedVal = lastSyncedSettings.current[key];

            if (localVal !== lastSyncedVal) {
              merged[key] = localVal;
            }
          }

          skipNextUpload.current = true;
          useSettingsStore.setState(merged as Partial<typeof rawState>);

          const success = await updateUserSettingsWithVersion(
            user.id,
            merged,
            latest.version,
            clientId.current
          );

          if (success) {
            console.log("[useSettingsSync] Merged settings uploaded successfully");
            lastVersion.current = latest.version + 1;
            lastClientId.current = clientId.current;
            lastSyncedSettings.current = { ...merged };
            skipNextFetch.current = true;
          } else {
            console.warn("[useSettingsSync] Merge upload failed due to version mismatch");
          }
          return;
        }

        const success = await updateUserSettingsWithVersion(
          user.id,
          settings,
          latest.version,
          clientId.current
        );

        if (success) {
          console.log("[useSettingsSync] Local settings uploaded successfully");
          lastVersion.current = latest.version + 1;
          lastClientId.current = clientId.current;
          lastSyncedSettings.current = { ...settings };
          skipNextFetch.current = true;
        } else {
          console.warn("[useSettingsSync] Upload failed due to version mismatch, will retry on next change");
        }
      } catch (error) {
        console.error("[useSettingsSync] Upload failed", error);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [user?.id, settings]);

  useEffect(() => {
    if (!user?.id) return;

    console.log("[useSettingsSync] Subscribing to Supabase Postgres Changes for user_id:", user.id);

    const channel = supabase
      .channel("settings-changes-" + user.id)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "settings",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("[useSettingsSync] Received Postgres change payload:", payload);

          try {
            const latest = await fetchUserSettings(user.id);
            if (!latest) return;

            if (latest.clientId === clientId.current) {
              console.log("[useSettingsSync] Change originated from this client, ignoring");
              return;
            }

            skipNextUpload.current = true;
            suppressNextUpload.current = true;

            lastVersion.current = latest.version;
            lastClientId.current = latest.clientId ?? null;
            lastSyncedSettings.current = { ...latest.settings };

            useSettingsStore.setState(latest.settings as Partial<typeof rawState>);
          } catch (err) {
            console.error("[useSettingsSync] Failed to update local settings from Realtime event", err);
          }
        }
      )
      .subscribe();

    return () => {
      console.log("[useSettingsSync] Unsubscribing from Supabase Postgres Changes for user_id:", user.id);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}