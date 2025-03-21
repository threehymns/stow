import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { Note, Folder } from "@/types/notes";

interface NoteState {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  expandedFolders: Record<string, boolean>;

  setActiveNoteId: (id: string | null) => void;
  createNote: (folderId?: string | null) => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  moveNote: (noteId: string, folderId: string | null) => void;

  createFolder: (name: string, parentId?: string | null) => string;
  updateFolder: (id: string, data: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  toggleFolderExpanded: (folderId: string) => void;
  isNoteInFolder: (noteId: string, folderId: string) => boolean;
}

// Helper to create a root folder if none exists
const createRootFolderIfNeeded = (folders: Folder[]): Folder[] => {
  if (folders.length === 0) {
    const now = new Date().toISOString();
    return [
      {
        id: "root",
        name: "All Notes",
        createdAt: now,
        parentId: null,
      },
    ];
  }
  return folders;
};

const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],
      folders: [],
      activeNoteId: null,
      expandedFolders: { root: true }, // Root folder is expanded by default

      setActiveNoteId: (id) => {
        set({ activeNoteId: id });
      },

      createNote: (folderId = null) => {
        const now = new Date().toISOString();
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
      },

      deleteNote: (id) => {
        const { notes, activeNoteId } = get();
        const filteredNotes = notes.filter((note) => note.id !== id);

        set({
          notes: filteredNotes,
          activeNoteId:
            activeNoteId === id
              ? filteredNotes.length > 0
                ? filteredNotes[0].id
                : null
              : activeNoteId,
        });
      },

      moveNote: (noteId, folderId) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === noteId
              ? { ...note, folderId, updatedAt: new Date().toISOString() }
              : note,
          ),
        }));
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

        return newFolder.id;
      },

      updateFolder: (id, data) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id ? { ...folder, ...data } : folder,
          ),
        }));
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
    }),
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
