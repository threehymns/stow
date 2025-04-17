import { supabase } from "@/integrations/supabase/client";
import { Note, Folder } from "@/types/notes";

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

/**
 * Sync notes and folders with Supabase
 */
export async function syncNotesAndFolders(userId: string, notes: Note[], folders: Folder[]): Promise<{ notes: Note[]; folders: Folder[] }> {
  console.log(`[Sync] Starting sync for user ${userId}...`);
  const startTime = Date.now();
  try {
    // Fetch remote notes and folders with retry
    const notesRes = await retryWithBackoff(async () => {
      const { data, error } = await supabase.from("notes").select("*").eq("user_id", userId);
      if (error) throw error;
      return { data, error };
    });
    const foldersRes = await retryWithBackoff(async () => {
      const { data, error } = await supabase.from("folders").select("*").eq("user_id", userId);
      if (error) throw error;
      return { data, error };
    });
    const supabaseNotes = notesRes.data || [];
    const supabaseFolders = foldersRes.data || [];

    // Upsert local notes
    if (notes.length) {
      await retryWithBackoff(async () => {
        const { error } = await supabase.from("notes").upsert(
          notes.map((n: Note) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            folder_id: n.folderId,
            user_id: userId,
            created_at: n.createdAt,
            updated_at: n.updatedAt,
          })),
          { onConflict: "id" }
        );
        if (error) throw error;
      });
    }
    // Upsert local folders
    if (folders.length) {
      await retryWithBackoff(async () => {
        const { error } = await supabase.from("folders").upsert(
          folders.map((f: Folder) => ({
            id: f.id,
            name: f.name,
            parent_id: f.parentId,
            user_id: userId,
            created_at: f.createdAt,
          })),
          { onConflict: "id" }
        );
        if (error) throw error;
      });
    }

    // Fetch final state (includes items upserted above)
    const { data: rowsNotes, error: rowsError } = await supabase.from("notes").select("*").eq("user_id", userId);
    if (rowsError) throw rowsError;
    const { data: rowsFolders, error: rowsFoldersError } = await supabase.from("folders").select("*").eq("user_id", userId);
    if (rowsFoldersError) throw rowsFoldersError;

    // Merge remote and local items to preserve local-only entries
    const rawLocalNotes = notes.map((n: Note) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      folder_id: n.folderId,
      user_id: userId,
      created_at: n.createdAt,
      updated_at: n.updatedAt,
    })).filter((local: Record<string, unknown>) => !rowsNotes.some((remote: Record<string, unknown>) => remote.id === local.id));
    const combinedNotes = [...rowsNotes, ...rawLocalNotes];

    const rawLocalFolders = folders.map((f: Folder) => ({
      id: f.id,
      name: f.name,
      parent_id: f.parentId,
      user_id: userId,
      created_at: f.createdAt,
    })).filter((local: Record<string, unknown>) => !rowsFolders.some((remote: Record<string, unknown>) => remote.id === local.id));
    const combinedFolders = [...rowsFolders, ...rawLocalFolders];

    // Map combined entries to Note and Folder types
    const mergedNotes: Note[] = combinedNotes.map((row: Record<string, unknown>) => ({
      id: row.id,
      title: row.title,
      content: row.content || "",
      folderId: row.folder_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) as Note[];
    const mergedFolders: Folder[] = combinedFolders.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      createdAt: row.created_at,
    })) as Folder[];

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
