import { supabase } from './client';

export type Settings = Record<string, string | number | boolean | null>;

export interface UserSettingsWithMeta {
  settings: Settings;
  updatedAt: string;
  version: number;
  clientId?: string | null;
}

/**
 * Fetch user settings JSON for the given user ID.
 */
export async function fetchUserSettings(userId: string): Promise<UserSettingsWithMeta | null> {
  console.log('[fetchUserSettings] called with userId:', userId);
  const { data, error } = await supabase
    .from('settings')
    .select('settings, updated_at, version, client_id')
    .eq('user_id', userId)
    .single();
  console.log('[fetchUserSettings] result:', { data, error });

  if (error || !data) {
    return null;
  }

  return {
    settings: data.settings as Settings,
    updatedAt: data.updated_at as string,
    version: data.version as number,
    clientId: data.client_id as string | null,
  };
}

/**
 * Insert default user settings for a new user.
 */
export async function insertDefaultUserSettings(
  userId: string,
  defaultSettings: Settings
): Promise<void> {
  console.log('[insertDefaultUserSettings] called with userId:', userId, 'defaultSettings:', defaultSettings);
  const { error } = await supabase.from('settings').insert({
    user_id: userId,
    settings: defaultSettings,
    version: 1,
    updated_at: new Date().toISOString(),
  });
  console.log('[insertDefaultUserSettings] insert result error:', error);

  if (error) {
    throw new Error(`Failed to insert default user settings: ${error?.message ?? String(error)}`);
  }
}

/**
 * Update user settings JSON and updated_at timestamp (legacy, no version check).
 */
export async function updateUserSettings(
  userId: string,
  updatedSettings: Settings
): Promise<void> {
  console.log('[updateUserSettings] called with userId:', userId, 'updatedSettings:', updatedSettings);
  const { error } = await supabase
    .from('settings')
    .update({
      settings: updatedSettings,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  console.log('[updateUserSettings] update result error:', error);

  if (error) {
    throw new Error(`Failed to update user settings: ${error?.message ?? String(error)}`);
  }
}

/**
 * Transactional update with optimistic concurrency control.
 * Updates settings only if current version matches expectedVersion.
 * Increments version by 1 on success.
 */
export async function updateUserSettingsWithVersion(
  userId: string,
  updatedSettings: Settings,
  expectedVersion: number,
  clientId: string
): Promise<boolean> {
  console.log('[updateUserSettingsWithVersion] called with userId:', userId, 'expectedVersion:', expectedVersion, 'clientId:', clientId);
  const { error, data } = await supabase
    .from('settings')
    .update({
      settings: updatedSettings,
      updated_at: new Date().toISOString(),
      version: expectedVersion + 1,
      client_id: clientId,
    })
    .eq('user_id', userId)
    .eq('version', expectedVersion)
    .select('*');

  console.log('[updateUserSettingsWithVersion] update result error:', error, 'data:', data);

  if (error) {
    throw new Error(`Failed to update user settings with version: ${error?.message ?? String(error)}`);
  }

  return (data?.length ?? 0) > 0;
}