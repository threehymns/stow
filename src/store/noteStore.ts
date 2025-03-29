
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { Note, Folder, DatabaseNote, DatabaseFolder } from "@/types/notes";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface NoteState {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  expandedFolders: Record<string, boolean>;
  isLoading: boolean;
  isSynced: boolean;

  setActiveNoteId: (id: string | null) => void;
  createNote: (folderId?: string | null) => string;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  moveNote: (noteId: string, folderId: string | null) => void;

  createFolder: (name: string, parentId?: string | null) => string;
  updateFolder: (id: string, data: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  toggleFolderExpanded: (folderId: string) => void;
  isNoteInFolder: (noteId: string, folderId: string) => boolean;
  
  syncWithSupabase: (userId: string) => Promise<void>;
  resetStore: () => void;
}

// Helper to create a root folder if none exists
const createRootFolderIfNeeded = (folders: Folder[]): Folder[] => {
  return folders;
};

const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => {
      const now = new Date().toISOString();
      const defaultNote: Note = {
        id: nanoid(),
        title: "Untitled Note",
        content: "",
        createdAt: now,
        updatedAt: now,
        folderId: null,
      };

      return {
        notes: [defaultNote],
        folders: [],
        activeNoteId: defaultNote.id,
        expandedFolders: { root: true }, // Root folder is expanded by default
        isLoading: false,
        isSynced: false,

        setActiveNoteId: (id) => {
          set({ activeNoteId: id });
        },

        createNote: (folderId = null) => {
          const now = new Date().toISOString();
          const { user } = supabase.auth.getSession();
          const newNote: Note = {
            id: nanoid(),
            title: "Untitled Note",
            content: "",
            createdAt: now,
            updatedAt: now,
            folderId: folderId,
          };

          set((state) => ({
            notes: [newNote, ...state.notes],
            activeNoteId: newNote.id,
          }));

          // If user is authenticated, create note in Supabase
          const { isSynced } = get();
          if (isSynced) {
            supabase.auth.getSession().then(({ data }) => {
              if (data.session) {
                supabase
                  .from('notes')
                  .insert({
                    id: newNote.id,
                    title: newNote.title,
                    content: newNote.content,
                    folder_id: newNote.folderId,
                    user_id: data.session.user.id,
                    created_at: newNote.createdAt,
                    updated_at: newNote.updatedAt
                  })
                  .then(({ error }) => {
                    if (error) {
                      console.error("Error syncing new note to Supabase:", error);
                    }
                  });
              }
            });
          }

          return newNote.id;
        },

        updateNote: (id, data) => {
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === id
                ? {
                    ...note,
                    ...data,
                    updatedAt: new Date().toISOString(),
                  }
                : note,
            ),
          }));

          // If user is authenticated, update note in Supabase
          const { isSynced } = get();
          if (isSynced) {
            const note = get().notes.find((n) => n.id === id);
            if (note) {
              supabase.auth.getSession().then(({ data }) => {
                if (data.session) {
                  const updateData: Record<string, any> = {
                    updated_at: new Date().toISOString()
                  };
                  
                  if (data.title !== undefined) updateData.title = data.title;
                  if (data.content !== undefined) updateData.content = data.content;
                  if (data.folderId !== undefined) updateData.folder_id = data.folderId;
                  
                  supabase
                    .from('notes')
                    .update(updateData)
                    .eq('id', id)
                    .eq('user_id', data.session.user.id)
                    .then(({ error }) => {
                      if (error) {
                        console.error("Error updating note in Supabase:", error);
                      }
                    });
                }
              });
            }
          }
        },

        deleteNote: (id) => {
          const { notes, activeNoteId } = get();
          const filteredNotes = notes.filter((note) => note.id !== id);
          const note = notes.find((note) => note.id === id);

          set({
            notes: filteredNotes,
            activeNoteId:
              activeNoteId === id
                ? filteredNotes.length > 0
                  ? filteredNotes[0].id
                  : null
                : activeNoteId,
          });
          
          if (note) {
            toast.success(`Successfully deleted "${note.title}"`);
            
            // If user is authenticated, delete note from Supabase
            const { isSynced } = get();
            if (isSynced) {
              supabase.auth.getSession().then(({ data }) => {
                if (data.session) {
                  supabase
                    .from('notes')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', data.session.user.id)
                    .then(({ error }) => {
                      if (error) {
                        console.error("Error deleting note from Supabase:", error);
                      }
                    });
                }
              });
            }
          }
        },

        moveNote: (noteId, folderId) => {
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === noteId
                ? { ...note, folderId, updatedAt: new Date().toISOString() }
                : note,
            ),
          }));
          
          // If user is authenticated, update note folder in Supabase
          const { isSynced } = get();
          if (isSynced) {
            supabase.auth.getSession().then(({ data }) => {
              if (data.session) {
                supabase
                  .from('notes')
                  .update({ 
                    folder_id: folderId,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', noteId)
                  .eq('user_id', data.session.user.id)
                  .then(({ error }) => {
                    if (error) {
                      console.error("Error moving note in Supabase:", error);
                    }
                  });
              }
            });
          }
        },

        createFolder: (name, parentId = null) => {
          const now = new Date().toISOString();
          const newFolder: Folder = {
            id: nanoid(),
            name,
            createdAt: now,
            parentId,
          };

          set((state) => {
            // Ensure we have a root folder
            const updatedFolders = createRootFolderIfNeeded([
              ...state.folders,
              newFolder,
            ]);

            return {
              folders: updatedFolders,
              expandedFolders: {
                ...state.expandedFolders,
                [parentId || "root"]: true, // Auto-expand parent folder
              },
            };
          });
          
          // If user is authenticated, create folder in Supabase
          const { isSynced } = get();
          if (isSynced) {
            supabase.auth.getSession().then(({ data }) => {
              if (data.session) {
                supabase
                  .from('folders')
                  .insert({
                    id: newFolder.id,
                    name: newFolder.name,
                    parent_id: newFolder.parentId,
                    user_id: data.session.user.id,
                    created_at: newFolder.createdAt
                  })
                  .then(({ error }) => {
                    if (error) {
                      console.error("Error syncing new folder to Supabase:", error);
                    }
                  });
              }
            });
          }

          return newFolder.id;
        },

        updateFolder: (id, data) => {
          set((state) => ({
            folders: state.folders.map((folder) =>
              folder.id === id ? { ...folder, ...data } : folder,
            ),
          }));
          
          // If user is authenticated, update folder in Supabase
          const { isSynced } = get();
          if (isSynced) {
            const folder = get().folders.find((f) => f.id === id);
            if (folder) {
              supabase.auth.getSession().then(({ data: sessionData }) => {
                if (sessionData.session) {
                  const updateData: Record<string, any> = {};
                  
                  if (data.name !== undefined) updateData.name = data.name;
                  if (data.parentId !== undefined) updateData.parent_id = data.parentId;
                  
                  supabase
                    .from('folders')
                    .update(updateData)
                    .eq('id', id)
                    .eq('user_id', sessionData.session.user.id)
                    .then(({ error }) => {
                      if (error) {
                        console.error("Error updating folder in Supabase:", error);
                      }
                    });
                }
              });
            }
          }
        },

        deleteFolder: (id) => {
          // Get all subfolders recursively
          const getAllSubfolderIds = (folderId: string): string[] => {
            const { folders } = get();
            const directSubfolders = folders.filter(
              (f) => f.parentId === folderId,
            );
            return [
              folderId,
              ...directSubfolders.flatMap((sf) => getAllSubfolderIds(sf.id)),
            ];
          };

          const folderIdsToRemove = getAllSubfolderIds(id);

          set((state) => {
            // Remove all notes in deleted folders
            const notesNotInFolders = state.notes.filter(
              (note) =>
                !note.folderId || !folderIdsToRemove.includes(note.folderId),
            );

            // Move notes from deleted folders to parent folder
            const folderToDelete = state.folders.find((f) => f.id === id);
            const parentId = folderToDelete?.parentId;
            const notesToMove = state.notes
              .filter(
                (note) =>
                  note.folderId && folderIdsToRemove.includes(note.folderId),
              )
              .map((note) => ({
                ...note,
                folderId: parentId,
                updatedAt: new Date().toISOString(),
              }));

            // Remove deleted folders from expanded state
            const newExpandedFolders = { ...state.expandedFolders };
            folderIdsToRemove.forEach((fid) => {
              delete newExpandedFolders[fid];
            });

            return {
              notes: [...notesNotInFolders, ...notesToMove],
              folders: state.folders.filter(
                (folder) => !folderIdsToRemove.includes(folder.id),
              ),
              expandedFolders: newExpandedFolders,
            };
          });
          
          // If user is authenticated, delete folder from Supabase
          const { isSynced } = get();
          if (isSynced) {
            supabase.auth.getSession().then(({ data }) => {
              if (data.session) {
                // Delete the folder and let RLS handle the cascade
                supabase
                  .from('folders')
                  .delete()
                  .eq('id', id)
                  .eq('user_id', data.session.user.id)
                  .then(({ error }) => {
                    if (error) {
                      console.error("Error deleting folder from Supabase:", error);
                    }
                  });
                
                // Update notes that were moved to parent folder
                const { notes } = get();
                const movedNotes = notes.filter(note => note.folderId === get().folders.find(f => f.id === id)?.parentId);
                
                for (const note of movedNotes) {
                  supabase
                    .from('notes')
                    .update({ 
                      folder_id: get().folders.find(f => f.id === id)?.parentId,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', note.id)
                    .eq('user_id', data.session.user.id)
                    .then(({ error }) => {
                      if (error) {
                        console.error("Error updating note folder in Supabase:", error);
                      }
                    });
                }
              }
            });
          }
        },

        toggleFolderExpanded: (folderId) => {
          set((state) => ({
            expandedFolders: {
              ...state.expandedFolders,
              [folderId]: !state.expandedFolders[folderId],
            },
          }));
        },

        isNoteInFolder: (noteId, folderId) => {
          const { notes } = get();
          const note = notes.find((n) => n.id === noteId);
          return note?.folderId === folderId;
        },
        
        syncWithSupabase: async (userId: string) => {
          const { notes, folders } = get();
          
          set({ isLoading: true });
          
          try {
            // Fetch notes from Supabase
            const { data: supabaseNotes, error: notesError } = await supabase
              .from('notes')
              .select('*')
              .eq('user_id', userId);
              
            if (notesError) throw notesError;
            
            // Fetch folders from Supabase
            const { data: supabseFolders, error: foldersError } = await supabase
              .from('folders')
              .select('*')
              .eq('user_id', userId);
              
            if (foldersError) throw foldersError;
            
            // If user has no notes or folders in Supabase, upload local data
            if (supabaseNotes.length === 0 && supabseFolders.length === 0) {
              // Upload folders first
              for (const folder of folders) {
                await supabase
                  .from('folders')
                  .insert({
                    id: folder.id,
                    name: folder.name,
                    parent_id: folder.parentId,
                    user_id: userId,
                    created_at: folder.createdAt
                  });
              }
              
              // Then upload notes
              for (const note of notes) {
                await supabase
                  .from('notes')
                  .insert({
                    id: note.id,
                    title: note.title,
                    content: note.content,
                    folder_id: note.folderId,
                    user_id: userId,
                    created_at: note.createdAt,
                    updated_at: note.updatedAt
                  });
              }
              
              toast.success('Notes synchronized to cloud');
            } else {
              // Otherwise, download data from Supabase
              const convertedNotes = supabaseNotes.map(note => ({
                id: note.id,
                title: note.title,
                content: note.content || '',
                folderId: note.folder_id,
                createdAt: note.created_at,
                updatedAt: note.updated_at
              }));
              
              const convertedFolders = supabseFolders.map(folder => ({
                id: folder.id,
                name: folder.name,
                parentId: folder.parent_id,
                createdAt: folder.created_at
              }));
              
              set({ 
                notes: convertedNotes,
                folders: convertedFolders,
                activeNoteId: convertedNotes.length > 0 ? convertedNotes[0].id : null
              });
              
              toast.success('Notes synchronized from cloud');
            }
            
            set({ isSynced: true });
          } catch (error) {
            console.error('Error syncing with Supabase:', error);
            toast.error('Failed to synchronize notes');
          } finally {
            set({ isLoading: false });
          }
        },
        
        resetStore: () => {
          const now = new Date().toISOString();
          const defaultNote: Note = {
            id: nanoid(),
            title: "Untitled Note",
            content: "",
            createdAt: now,
            updatedAt: now,
            folderId: null,
          };
          
          set({
            notes: [defaultNote],
            folders: [],
            activeNoteId: defaultNote.id,
            expandedFolders: { root: true },
            isSynced: false
          });
        }
      };
    },
    {
      name: "notes-storage",
      onRehydrateStorage: () => (state) => {
        // Ensure we have a root folder after rehydration
        if (state) {
          state.folders = createRootFolderIfNeeded(state.folders);
        }
      },
    },
  ),
);

export default useNoteStore;
