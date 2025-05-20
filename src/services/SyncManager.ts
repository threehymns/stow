import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import { retryWithBackoff } from "./noteService";

export interface Identifiable {
  id: string;
}

export interface SyncConfig<Local extends Identifiable> {
  table: string;
  mapRow: (row: any) => Local;
  mapLocal: (item: Local, userId: string) => Record<string, unknown>;
  updatedAtColumn?: string;
}

export class SyncManager<Local extends Identifiable> {
  constructor(private supabase: SupabaseClient, private cfg: SyncConfig<Local>) {}

  /**
   * Sync localItems to remote and fetch remote items.
   * @param since ISO timestamp to filter remote updates (inclusive)
   */
  async sync(userId: string, localItems: Local[], since?: string): Promise<Local[]> {
    // 1. Fetch remote items (optionally incremental) - (existing code)
    let query = this.supabase
      .from(this.cfg.table)
      .select("*")
      .eq("user_id", userId);
    if (since && this.cfg.updatedAtColumn) {
      query = query.gt(this.cfg.updatedAtColumn, since);
    }
    const { data: remoteRowsData, error: fetchError } = await query;
    if (fetchError) throw fetchError; // Propagate fetch errors

    const remoteRows = remoteRowsData || [];
    const remoteItems = remoteRows.map(r => this.cfg.mapRow(r));
    const remoteIds = new Set(remoteItems.map(item => item.id));

    // 2. Detect local-only items (items in input localItems not present in remoteItems)
    const localOnlyItems = localItems.filter(item => !remoteIds.has(item.id));

    // 3. Insert local-only items into the remote database
    if (localOnlyItems.length) {
      try {
        await retryWithBackoff(async () => {
          const payload = localOnlyItems.map(item => this.cfg.mapLocal(item, userId));
          const { error: insertError } = await this.supabase
            .from(this.cfg.table)
            .insert(payload); // Use insert for new items

          if (insertError) {
            // Let retryWithBackoff handle retries.
            throw insertError;
          }
        });
      } catch (insertError) {
        // All retries exhausted – keep going but surface the issue for observability.
        console.warn(
          `[SyncManager] Failed to insert local-only items for table ${this.cfg.table} after retries: ${(insertError as Error).message}`,
          localOnlyItems
        );
      }
    }

    // 4. Return remote items and the original local-only items for cache update
    // The local cache will be updated with what's on the server + new items created locally.
    // If an insert failed, the local-only item remains in the cache and might be retried next sync.
    return [...remoteItems, ...localOnlyItems];
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
