import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import { retryWithBackoff } from "./noteService";
import { deepEqual } from "@/lib/utils";

export interface Identifiable {
  id: string;
}

export interface SyncConfig<Local extends Identifiable> {
  table: string;
  mapRow: (row: any) => Local;
  mapLocal: (item: Local, userId: string) => Record<string, unknown>;
  updatedAtColumn?: string;
  /**
   * Page size for fetching records. Defaults to 1000.
   * Adjust based on your record size and performance needs.
   */
  pageSize?: number;
}

export class SyncManager<Local extends Identifiable> {
  constructor(private supabase: SupabaseClient, private cfg: SyncConfig<Local>) {}

  /**
   * Sync localItems to remote and fetch remote items.
   * @param since ISO timestamp to filter remote updates (inclusive)
   */
  async sync(userId: string, localItems: Local[], since?: string): Promise<Local[]> {
    // 1. Fetch remote items with incremental sync support
    const pageSize = this.cfg.pageSize || 1000;
    let cursor = since ?? undefined;
    let allRemoteRows: any[] = [];

    while (true) {
      const updatedCol = this.cfg.updatedAtColumn || 'updated_at';
      let query = this.supabase
        .from(this.cfg.table)
        .select('*')
        .eq('user_id', userId)
        .order(updatedCol, { ascending: true })
        .limit(pageSize);

      if (cursor) {
        query = query.gt(updatedCol, cursor);
      }

      const { data: pageData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      if (!pageData || pageData.length === 0) {
        break; // No more data
      }

      allRemoteRows = [...allRemoteRows, ...pageData];

      // Update cursor for the next page
      cursor = pageData[pageData.length - 1][updatedCol];

      // If we got fewer items than requested, we've reached the end
      if (pageData.length < pageSize) {
        break;
      }
    }

    const remoteRows = allRemoteRows;
    const remoteItems = remoteRows.map(r => this.cfg.mapRow(r));
    const remoteMap = new Map(remoteItems.map(item => [item.id, item]));
    const localMap = new Map(localItems.map(item => [item.id, item]));

    // 2. Categorize items
    const localOnlyItems: Local[] = [];
    const remoteOnlyItems: Local[] = [];
    const modifiedItems: { local: Local; remote: Local; isLocalNewer: boolean }[] = [];

    // Check local items first
    for (const localItem of localItems) {
      const remoteItem = remoteMap.get(localItem.id);
      if (!remoteItem) {
        localOnlyItems.push(localItem);
      } else {
        // Check if local item is modified by comparing content, not just timestamps
        const { [this.cfg.updatedAtColumn || 'updatedAt']: localUpdatedAt, ...localWithoutTs } = localItem as any;
        const { [this.cfg.updatedAtColumn || 'updatedAt']: remoteUpdatedAt, ...remoteWithoutTs } = remoteItem as any;
        
        // Use deep equality check instead of JSON.stringify for accurate object comparison
        if (!deepEqual(localWithoutTs, remoteWithoutTs)) {
          // Default to treating items with missing timestamps as older than any item with a valid timestamp
          const localTimeRaw = localUpdatedAt ? new Date(localUpdatedAt).getTime() : Number.NEGATIVE_INFINITY;
          const localTime = Number.isNaN(localTimeRaw) ? Number.NEGATIVE_INFINITY : localTimeRaw;
          const remoteTimeRaw = remoteUpdatedAt ? new Date(remoteUpdatedAt).getTime() : Number.NEGATIVE_INFINITY;
          const remoteTime = Number.isFinite(remoteTimeRaw) ? remoteTimeRaw : Number.NEGATIVE_INFINITY;
          const isLocalNewer = localTime > remoteTime;
          
          modifiedItems.push({ 
            local: localItem, 
            remote: remoteItem,
            isLocalNewer
          });
        }
      }
    }

    // Find remote-only items
    for (const remoteItem of remoteItems) {
      if (!localMap.has(remoteItem.id)) {
        remoteOnlyItems.push(remoteItem);
      }
    }

    // 3. Handle local-only items (new items)
    if (localOnlyItems.length > 0) {
      try {
        await retryWithBackoff(async () => {
          const payload = localOnlyItems.map(item => this.cfg.mapLocal(item, userId));
          const { error: insertError } = await this.supabase
            .from(this.cfg.table)
            .insert(payload);

          if (insertError) throw insertError;
        });
      } catch (insertError) {
        console.warn(
          `[SyncManager] Failed to insert local-only items for table ${this.cfg.table} after retries: ${(insertError as Error).message}`,
          localOnlyItems
        );
      }
    }

    // 4. Handle modified items with conflict resolution
    if (modifiedItems.length > 0) {
      try {
        await retryWithBackoff(async () => {
          const updates = [];
          const now = new Date().toISOString();
          
          for (const { local, remote, isLocalNewer } of modifiedItems) {
            // Only update if local changes are actually newer or if there are content changes
            if (isLocalNewer) {
              const updateData = this.cfg.mapLocal(local, userId);
              // Ensure updated_at is set to now for the last-write-wins strategy
              if (this.cfg.updatedAtColumn) {
                updateData[this.cfg.updatedAtColumn] = now;
                // Also update the local object's timestamp to match
                (local as any)[this.cfg.updatedAtColumn] = now;
              }
              updates.push(updateData);
            }
          }

          if (updates.length > 0) {
            const { error: updateError } = await this.supabase
              .from(this.cfg.table)
              .upsert(updates, { onConflict: 'id' });

            if (updateError) throw updateError;
          }
        });
      } catch (updateError) {
        console.warn(
          `[SyncManager] Failed to update modified items for table ${this.cfg.table}: ${(updateError as Error).message}`,
          modifiedItems
        );
      }
    }

    // 5. Return combined results including unchanged items
    const mergedItems = [...remoteOnlyItems, ...localOnlyItems];
    
    // Add modified items (either local or remote version)
    for (const { local, remote, isLocalNewer } of modifiedItems) {
      mergedItems.push(isLocalNewer ? local : remote);
    }
    
    // Add unchanged items (present in both local and remote but with identical content)
    const processedIds = new Set(mergedItems.map(item => item.id));
    for (const remoteItem of remoteItems) {
      if (!processedIds.has(remoteItem.id)) {
        mergedItems.push(remoteItem);
      }
    }
    
    return mergedItems;
  }

  subscribe(
    userId: string,
    callback: (payload: unknown) => void
  ): RealtimeChannel {
    const channel = this.supabase.channel(`${this.cfg.table}-changes-${userId}`);
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: this.cfg.table, filter: `user_id=eq.${userId}` },
      callback
    );
    channel.subscribe();
    return channel;
  }

  unsubscribe(channel: RealtimeChannel) {
    this.supabase.removeChannel(channel);
  }
}
