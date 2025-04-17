import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import { retryWithBackoff } from "./noteService";

export interface SyncConfig<Local> {
  table: string;
  mapRow: (row: any) => Local;
  mapLocal: (item: Local, userId: string) => Record<string, unknown>;
  updatedAtColumn?: string;
}

export class SyncManager<Local> {
  constructor(private supabase: SupabaseClient, private cfg: SyncConfig<Local>) {}

  /**
   * Sync localItems to remote and fetch remote items.
   * @param since ISO timestamp to filter remote updates (inclusive)
   */
  async sync(userId: string, localItems: Local[], since?: string): Promise<Local[]> {
    // upsert local items
    if (localItems.length) {
      await retryWithBackoff(async () => {
        const payload = localItems.map(item => this.cfg.mapLocal(item, userId));
        const { error } = await this.supabase
          .from(this.cfg.table)
          .upsert(payload, { onConflict: "id" });
        if (error) throw error;
      });
    }

    // fetch remote items (optionally incremental)
    let query = this.supabase
      .from(this.cfg.table)
      .select("*")
      .eq("user_id", userId);
    if (since && this.cfg.updatedAtColumn) {
      query = query.gt(this.cfg.updatedAtColumn, since);
    }
    const { data: rows, error } = await query;
    if (error) throw error;
    const remoteRows = rows || [];

    // map rows to Local
    const remoteItems = (remoteRows as any[]).map(r => this.cfg.mapRow(r));

    // detect local-only items
    const remoteIds = new Set(remoteItems.map((item: any) => (item as any).id));
    const localOnly = localItems.filter(item => !remoteIds.has((item as any).id));

    return [...remoteItems, ...localOnly];
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
