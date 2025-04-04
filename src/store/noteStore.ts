import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { Note, Folder } from "@/types/notes";
import { getCurrentTimestamp } from "@/services/noteService";

interface LoadingStates {
  createNote: boolean;
  updateNote: boolean;
  deleteNote: boolean;
  moveNote: boolean;
  createFolder: boolean;
  updateFolder: boolean;
  deleteFolder: boolean;
  sync: boolean;
}

interface ErrorStates {
  createNote?: string;
  updateNote?: string;
  deleteNote?: string;
  moveNote?: string;
  createFolder?: string;
  updateFolder?: string;
  deleteFolder?: string;
  sync?: string;
}

interface NoteState {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  expandedFolders: Record<string, boolean>;
  isLoading: boolean;
  isSynced: boolean;
  loadingStates: LoadingStates;
  errorStates: ErrorStates;

  setActiveNoteId: (id: string | null) => void;
  createNoteLocal: (folderId?: string | null) => string;
  updateNoteLocal: (id: string, data: Partial<Note>) => void;
  deleteNoteLocal: (id: string) => void;
  moveNoteLocal: (noteId: string, folderId: string | null) => void;

  createFolderLocal: (name: string, parentId?: string | null) => string;
  updateFolderLocal: (id: string, data: Partial<Folder>) => void;
  deleteFolderLocal: (id: string) => void;
  toggleFolderExpanded: (folderId: string) => void;
  isNoteInFolder: (noteId: string, folderId: string) => boolean;

  resetStore: () => void;
}

const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => {
      const now = getCurrentTimestamp();
      const defaultNote: Note = {
        id: uuidv4(),
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
        expandedFolders: { root: true },
        isLoading: false,
        isSynced: false,
        loadingStates: {
          createNote: false,
          updateNote: false,
          deleteNote: false,
          moveNote: false,
          createFolder: false,
          updateFolder: false,
          deleteFolder: false,
          sync: false,
        },
        errorStates: {},

        setActiveNoteId: (id) => {
          set({ activeNoteId: id });
        },

        createNoteLocal: (folderId = null) => {
          const now = getCurrentTimestamp();
          const newNote: Note = {
            id: uuidv4(),
            title: "Untitled Note",
            content: "",
            createdAt: now,
            updatedAt: now,
            folderId,
          };

          set((state) => ({
            notes: [newNote, ...state.notes],
            activeNoteId: newNote.id,
          }));

          return newNote.id;
        },

        updateNoteLocal: (id, data) => {
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === id
                ? {
                    ...note,
                    ...data,
                    updatedAt: getCurrentTimestamp(),
                  }
                : note,
            ),
          }));
        },

        deleteNoteLocal: (id) => {
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

        moveNoteLocal: (noteId, folderId) => {
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === noteId
                ? { ...note, folderId, updatedAt: getCurrentTimestamp() }
                : note,
            ),
          }));
        },

        createFolderLocal: (name, parentId = null) => {
          const now = getCurrentTimestamp();
          const newFolder: Folder = {
            id: uuidv4(),
            name,
            createdAt: now,
            parentId,
          };

          set((state) => {
            const updatedFolders = [...state.folders, newFolder];

            return {
              folders: updatedFolders,
              expandedFolders: {
                ...state.expandedFolders,
                [parentId || "root"]: true,
              },
            };
          });

          return newFolder.id;
        },

        updateFolderLocal: (id, data) => {
          set((state) => ({
            folders: state.folders.map((folder) =>
              folder.id === id ? { ...folder, ...data } : folder,
            ),
          }));
        },

        deleteFolderLocal: (id) => {
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
            const notesNotInFolders = state.notes.filter(
              (note) =>
                !note.folderId || !folderIdsToRemove.includes(note.folderId),
            );

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
                updatedAt: getCurrentTimestamp(),
              }));

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

        resetStore: () => {
          const now = getCurrentTimestamp();
          const defaultNote: Note = {
            id: uuidv4(),
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
            isSynced: false,
            loadingStates: {
              createNote: false,
              updateNote: false,
              deleteNote: false,
              moveNote: false,
              createFolder: false,
              updateFolder: false,
              deleteFolder: false,
              sync: false,
            },
            errorStates: {},
          });
        },
      };
    },
    {
      name: "note-app-storage",
      onRehydrateStorage: () => (state) => {},
    },
  ),
);

export default useNoteStore;
