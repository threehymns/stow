
import { supabase } from "@/integrations/supabase/client";
import { Note, Folder } from "@/types/notes";

/**
 * Utility to get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
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
  // Fetch notes
  const { data: supabaseNotes = [], error: notesError } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId);
    
  if (notesError) {
    console.error("Error fetching notes:", notesError);
    throw notesError;
  }

  // Fetch folders
  const { data: supabaseFolders = [], error: foldersError } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", userId);
    
  if (foldersError) {
    console.error("Error fetching folders:", foldersError);
    throw foldersError;
  }

  // If no data in Supabase, upload local data
  if (supabaseNotes.length === 0 && supabaseFolders.length === 0) {
    console.log("No data in Supabase, uploading local data");
    
    try {
      // First create folders to establish parent-child relationships
      for (const folder of folders) {
        await createFolder(folder, userId);
      }
      
      // Then create notes with folder references
      for (const note of notes) {
        await createNote(note, userId);
      }
      
      return { notes, folders };
    } catch (error) {
      console.error("Error uploading local data:", error);
      throw error;
    }
  }

  // Otherwise, convert Supabase data to local format
  const convertedNotes: Note[] = supabaseNotes.map((note: any) => ({
    id: note.id,
    title: note.title,
    content: note.content || "",
    folderId: note.folder_id,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  }));

  const convertedFolders: Folder[] = supabaseFolders.map((folder: any) => ({
    id: folder.id,
    name: folder.name,
    parentId: folder.parent_id,
    createdAt: folder.created_at,
  }));

  return { notes: convertedNotes, folders: convertedFolders };
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
