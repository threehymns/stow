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
  await supabase.from("notes").insert({
    id: note.id,
    title: note.title,
    content: note.content,
    folder_id: note.folderId,
    user_id: userId,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  });
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

  await supabase
    .from("notes")
    .update(updateData)
    .eq("id", noteId)
    .eq("user_id", userId);
}

/**
 * Delete a note in Supabase
 */
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", userId);
}

/**
 * Move a note to a folder in Supabase
 */
export async function moveNote(noteId: string, folderId: string | null, userId: string): Promise<void> {
  await supabase
    .from("notes")
    .update({
      folder_id: folderId,
      updated_at: getCurrentTimestamp(),
    })
    .eq("id", noteId)
    .eq("user_id", userId);
}

/**
 * Create a folder in Supabase
 */
export async function createFolder(folder: Folder, userId: string): Promise<void> {
  await supabase.from("folders").insert({
    id: folder.id,
    name: folder.name,
    parent_id: folder.parentId,
    user_id: userId,
    created_at: folder.createdAt,
  });
}

/**
 * Update a folder in Supabase
 */
export async function updateFolder(folderId: string, data: Partial<Folder>, userId: string): Promise<void> {
  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.parentId !== undefined) updateData.parent_id = data.parentId;

  await supabase
    .from("folders")
    .update(updateData)
    .eq("id", folderId)
    .eq("user_id", userId);
}

/**
 * Delete a folder in Supabase
 */
export async function deleteFolder(folderId: string, userId: string): Promise<void> {
  await supabase
    .from("folders")
    .delete()
    .eq("id", folderId)
    .eq("user_id", userId);
}

/**
 * Sync notes and folders with Supabase
 */
export async function syncNotesAndFolders(userId: string, notes: Note[], folders: Folder[]): Promise<{ notes: Note[]; folders: Folder[] }> {
  // Fetch notes
  const { data: supabaseNotes = [] } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId);

  // Fetch folders
  const { data: supabaseFolders = [] } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", userId);

  // If no data in Supabase, upload local data
  if (supabaseNotes.length === 0 && supabaseFolders.length === 0) {
    for (const folder of folders) {
      await createFolder(folder, userId);
    }
    for (const note of notes) {
      await createNote(note, userId);
    }
    return { notes, folders };
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