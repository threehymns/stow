import { supabase } from "@/integrations/supabase/client";
import { Note, Folder } from "@/types/notes";
import { SyncManager } from "./SyncManager";

/**
 * Utility to get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Retry helper with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(`Retrying after error: ${error}. Retries left: ${retries}`);
    await new Promise(res => setTimeout(res, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

/**
 * Create a note in Supabase
 */
export async function createNote(note: Note, userId: string): Promise<void> {
  const { error } = await supabase.from("notes").insert({
    id: note.id,
    title: note.title,
    content: note.content,
    folder_id: note.folderId,
    user_id: userId,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  });
  
  if (error) {
    console.error("Error creating note:", error);
    throw error;
  }
}

/**
 * Update a note in Supabase
 */
export async function updateNote(noteId: string, data: Partial<Note>, userId: string): Promise<void> {
  const updateData: Record<string, unknown> = {
    ...("title" in data ? { title: data.title } : {}),
    ...("content" in data ? { content: data.content } : {}),
    ...("folderId" in data ? { folder_id: data.folderId } : {}),
    updated_at: getCurrentTimestamp(),
  };

  const { error } = await supabase
    .from("notes")
    .update(updateData)
    .eq("id", noteId)
    .eq("user_id", userId);
    
  if (error) {
    console.error("Error updating note:", error);
    throw error;
  }
}

/**
 * Delete a note in Supabase
 */
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", userId);
    
  if (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
}

/**
 * Move a note to a folder in Supabase
 */
export async function moveNote(noteId: string, folderId: string | null, userId: string): Promise<void> {
  const { error } = await supabase
    .from("notes")
    .update({
      folder_id: folderId,
      updated_at: getCurrentTimestamp(),
    })
    .eq("id", noteId)
    .eq("user_id", userId);
    
  if (error) {
    console.error("Error moving note:", error);
    throw error;
  }
}

/**
 * Create a folder in Supabase
 */
export async function createFolder(folder: Folder, userId: string): Promise<void> {
  const { error } = await supabase.from("folders").insert({
    id: folder.id,
    name: folder.name,
    parent_id: folder.parentId,
    user_id: userId,
    created_at: folder.createdAt,
  });
  
  if (error) {
    console.error("Error creating folder:", error);
    throw error;
  }
}

/**
 * Update a folder in Supabase
 */
export async function updateFolder(folderId: string, data: Partial<Folder>, userId: string): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.parentId !== undefined) updateData.parent_id = data.parentId;

  const { error } = await supabase
    .from("folders")
    .update(updateData)
    .eq("id", folderId)
    .eq("user_id", userId);
    
  if (error) {
    console.error("Error updating folder:", error);
    throw error;
  }
}

/**
 * Delete a folder in Supabase
 */
export async function deleteFolder(folderId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", folderId)
    .eq("user_id", userId);
    
  if (error) {
    console.error("Error deleting folder:", error);
    throw error;
  }
}

const noteSyncManager = new SyncManager<Note>(supabase, {
  table: "notes",
  mapRow: (row: any) => ({
    id: row.id as string,
    title: row.title as string,
    content: row.content || "",
    folderId: row.folder_id as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }),
  mapLocal: (item: Note, userId: string) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    folder_id: item.folderId,
    user_id: userId,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }),
  updatedAtColumn: "updated_at",
});
const folderSyncManager = new SyncManager<Folder>(supabase, {
  table: "folders",
  mapRow: (row: any) => ({
    id: row.id as string,
    name: row.name as string,
    parentId: row.parent_id as string | null,
    createdAt: row.created_at as string,
  }),
  mapLocal: (item: Folder, userId: string) => ({
    id: item.id,
    name: item.name,
    parent_id: item.parentId,
    user_id: userId,
    created_at: item.createdAt,
  }),
});

/**
 * Sync notes and folders with Supabase
 */
export async function syncNotesAndFolders(userId: string, notes: Note[], folders: Folder[], since?: string): Promise<{ notes: Note[]; folders: Folder[] }> {
  console.log(`[Sync] Starting sync for user ${userId}...`);
  const startTime = Date.now();
  try {
    const [mergedNotes, mergedFolders] = await Promise.all([
      noteSyncManager.sync(userId, notes, since),
      folderSyncManager.sync(userId, folders),
    ]);
    console.log(`[Sync] Completed successfully in ${Date.now() - startTime} ms`);
    return { notes: mergedNotes, folders: mergedFolders };
  } catch (error) {
    console.error(`[Sync] Failed after ${Date.now() - startTime} ms:`, error);
    throw error;
  }
}

/**
 * Check if realtime is working
 */
export async function testRealtimeConnection(): Promise<boolean> {
  try {
    const channel = supabase.channel('realtime-test');
    const subscription = channel.subscribe((status) => {
      console.log('Realtime connection status:', status);
      return status === 'SUBSCRIBED';
    });
    
    // Clean up the test channel after 2 seconds
    setTimeout(() => {
      supabase.removeChannel(channel);
    }, 2000);
    
    return true;
  } catch (error) {
    console.error('Realtime connection test failed:', error);
    return false;
  }
}
