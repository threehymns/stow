
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
  const updateData: Record<string, any> = {
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
  const updateData: Record<string, any> = {};
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
    // Fetch remote notes with retry
    const { data: supabaseNotes = [], error: notesError } = await retryWithBackoff(async () =>
      await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
    );

    if (notesError) {
      console.error("[Sync] Error fetching notes:", notesError);
      throw notesError;
    }

    // Fetch remote folders with retry
    const { data: supabaseFolders = [], error: foldersError } = await retryWithBackoff(async () =>
      await supabase
        .from("folders")
        .select("*")
        .eq("user_id", userId)
    );

    if (foldersError) {
      console.error("[Sync] Error fetching folders:", foldersError);
      throw foldersError;
    }

    // Convert remote data
    const remoteNotes: Note[] = supabaseNotes.map((note: any) => ({
      id: note.id,
      title: note.title,
      content: note.content || "",
      folderId: note.folder_id,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }));

    const remoteFolders: Folder[] = supabaseFolders.map((folder: any) => ({
      id: folder.id,
      name: folder.name,
      parentId: folder.parent_id,
      createdAt: folder.created_at,
    }));

    // Merge folders (simple union, no conflict resolution yet)
    const mergedFolders: Folder[] = [...folders];
    for (const remoteFolder of remoteFolders) {
      if (!folders.some(f => f.id === remoteFolder.id)) {
        mergedFolders.push(remoteFolder);
      }
    }

    // Upload missing local folders to Supabase
    const missingFolders = folders.filter(folder => !remoteFolders.some(f => f.id === folder.id));
    if (missingFolders.length > 0) {
      await retryWithBackoff(async () => {
        const { error } = await supabase.from("folders").insert(
          missingFolders.map(folder => ({
            id: folder.id,
            name: folder.name,
            parent_id: folder.parentId,
            user_id: userId,
            created_at: folder.createdAt,
          }))
        );
        if (error) {
          console.error("Error batch uploading folders:", error);
          throw error;
        }
      });
    }

    // Merge notes with timestamp-based conflict resolution
    const mergedNotes: Note[] = [];

    const missingNotes: Note[] = [];
    for (const localNote of notes) {
      const remoteNote = remoteNotes.find(n => n.id === localNote.id);
      if (!remoteNote) {
        missingNotes.push(localNote);
      } else {
        // Both exist, compare updatedAt
        if (new Date(localNote.updatedAt).getTime() > new Date(remoteNote.updatedAt).getTime()) {
          // Local is newer, update remote
          await retryWithBackoff(() => updateNote(localNote.id, {
            title: localNote.title,
            content: localNote.content,
            folderId: localNote.folderId,
          }, userId));
          mergedNotes.push(localNote);
        } else {
          // Remote is newer or same, keep remote
          mergedNotes.push(remoteNote);
        }
      }
    }
  
    if (missingNotes.length > 0) {
      await retryWithBackoff(async () => {
        const { error } = await supabase.from("notes").insert(
          missingNotes.map(note => ({
            id: note.id,
            title: note.title,
            content: note.content,
            folder_id: note.folderId,
            user_id: userId,
            created_at: note.createdAt,
            updated_at: note.updatedAt,
          }))
        );
        if (error) {
          console.error("Error batch uploading notes:", error);
          throw error;
        }
      });
      mergedNotes.push(...missingNotes);
    }

    // Add remote-only notes to merged list
    for (const remoteNote of remoteNotes) {
      if (!notes.some(n => n.id === remoteNote.id)) {
        mergedNotes.push(remoteNote);
      }
    }

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
