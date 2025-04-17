import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { Note, Folder } from "@/types/notes";
import { getCurrentTimestamp } from "@/services/noteService";
import { supabase } from "@/integrations/supabase/client";
import {
  syncNotesAndFolders,
  createNote as createNoteService,
  updateNote as updateNoteService,
  deleteNote as deleteNoteService,
  moveNote as moveNoteService,
  updateFolder as updateFolderService,
  createFolder as createFolderService,
  deleteFolder as deleteFolderService,
} from "@/services/noteService";
import { SyncManager } from "@/services/SyncManager";

/**
 * Debounce utility
 */
function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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
  realtimeEnabled: boolean;
  lastSyncTimestamp: string | null;
  lastRealtimeUpdate: string | null;
  loadingStates: LoadingStates;
  errorStates: ErrorStates;
  hasHydrated: boolean;
  setHasHydrated: () => void;

  setActiveNoteId: (id: string | null) => void;
  createFolder: (name: string, userId: string) => Promise<string>;
  deleteFolder: (id: string, userId: string) => Promise<void>;
  toggleFolderExpanded: (folderId: string) => void;
  isNoteInFolder: (noteId: string, folderId: string) => boolean;

  deleteNote: (id: string, userId: string) => Promise<void>;
  createNote: (folderId: string | null, userId: string) => Promise<string>;
  updateNote: (noteId: string, data: Partial<Note>, userId: string) => Promise<void>;
  moveNote: (noteId: string, folderId: string | null, userId: string) => Promise<void>;
  syncAll: (userId: string) => Promise<void>;
  enableRealtime: (userId: string) => void;
  disableRealtime: () => void;
  resetStore: () => void;
  setupPresenceChannel?: (userId: string) => void;
  updateFolder: (id: string, data: Partial<Folder>, userId: string) => Promise<void>;
  updateNoteLocal: (noteId: string, data: Partial<Note>) => void;
  pendingOperations: PendingOperation[];
  flushQueue: (userId: string) => Promise<void>;
}

type PendingOperation = {
  type: "createNote" | "updateNote" | "deleteNote" | "moveNote" | "createFolder" | "updateFolder" | "deleteFolder";
  args: unknown[];
};

const noteSyncManager = new SyncManager<Note>(supabase, {
  table: "notes",
  mapRow: (row: any) => ({ id: row.id as string, title: row.title as string, content: row.content || "", folderId: row.folder_id as string | null, createdAt: row.created_at as string, updatedAt: row.updated_at as string }),
  mapLocal: (item: Note, userId: string) => ({ id: item.id, title: item.title, content: item.content, folder_id: item.folderId, user_id: userId, created_at: item.createdAt, updated_at: item.updatedAt }),
});

const folderSyncManager = new SyncManager<Folder>(supabase, {
  table: "folders",
  mapRow: (row: any) => ({ id: row.id as string, name: row.name as string, parentId: row.parent_id as string | null, createdAt: row.created_at as string }),
  mapLocal: (item: Folder, userId: string) => ({ id: item.id, name: item.name, parent_id: item.parentId, user_id: userId, created_at: item.createdAt }),
});

let realtimeChannels: { note: any; folder: any } | null = null;

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

      const createNoteLocal = (folderId?: string | null) => {
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
      };

      const updateNoteLocal = (id: string, data: Partial<Note>) => {
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
      };

      const deleteNoteLocal = (id: string) => {
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
      };

      const moveNoteLocal = (noteId: string, folderId: string | null) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === noteId
              ? { ...note, folderId, updatedAt: getCurrentTimestamp() }
              : note,
          ),
        }));
      };

      const createFolderLocal = (name: string, parentId: string | null = null) => {
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
      };

      const updateFolderLocal = (id: string, data: Partial<Folder>) => {
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === id ? { ...folder, ...data } : folder,
          ),
        }));
      };

      const deleteFolderLocal = (id: string) => {
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
      };

      // Flush offline operations
      const flushQueue = async (userId: string) => {
        const ops = [...get().pendingOperations];
        for (const op of ops) {
          try {
            switch (op.type) {
              case "createNote": {
                const [noteId] = op.args as [string];
                const note = get().notes.find(n => n.id === noteId);
                if (note) await createNoteService(note, userId);
                break;
              }
              case "updateNote": {
                const [noteId, data] = op.args as [string, Partial<Note>];
                await updateNoteService(noteId, data, userId);
                break;
              }
              case "deleteNote": {
                const [id] = op.args as [string];
                await deleteNoteService(id, userId);
                break;
              }
              case "moveNote": {
                const [noteId, folderId] = op.args as [string, string|null];
                await moveNoteService(noteId, folderId, userId);
                break;
              }
              case "createFolder": {
                const [folderId] = op.args as [string];
                const folder = get().folders.find(f => f.id === folderId);
                if (folder) await createFolderService(folder, userId);
                break;
              }
              case "updateFolder": {
                const [id, data] = op.args as [string, Partial<Folder>];
                await updateFolderService(id, data, userId);
                break;
              }
              case "deleteFolder": {
                const [id] = op.args as [string];
                await deleteFolderService(id, userId);
                break;
              }
            }
            set(state => ({ pendingOperations: state.pendingOperations.filter((_, i) => i !== 0) }));
          } catch (error) {
            if (!navigator.onLine) return;
            console.error("Error flushing operation", op, error);
            set(state => ({ errorStates: { ...state.errorStates, sync: "Error flushing offline queue" } }));
            return;
          }
        }
      };

      return {
        notes: [defaultNote],
        folders: [],
        activeNoteId: defaultNote.id,
        expandedFolders: { root: true },
        isLoading: false,
        isSynced: false,
        realtimeEnabled: false,
        lastSyncTimestamp: null,
        lastRealtimeUpdate: null,
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
        hasHydrated: false,
        setHasHydrated: () => set({ hasHydrated: true }),
        pendingOperations: [],
        flushQueue,

        enableRealtime: (userId: string) => {
          if (realtimeChannels) {
            try {
              supabase.removeChannel(realtimeChannels.note);
              supabase.removeChannel(realtimeChannels.folder);
            } catch (error: unknown) {
              console.error("Error removing channel:", error);
            }
          }

          const noteChannel = noteSyncManager.subscribe(
            userId,
            debounce((payload: unknown) => {
              console.log('Realtime update for notes:', payload);

              const { eventType, new: newRecord, old: oldRecord } = payload as {
                eventType: string;
                new: Record<string, unknown>;
                old: Record<string, unknown>;
              };

              if (eventType === 'INSERT') {
                const newNote: Note = {
                  id: newRecord.id as string,
                  title: newRecord.title as string,
                  content: newRecord.content as string || "",
                  createdAt: newRecord.created_at as string,
                  updatedAt: newRecord.updated_at as string,
                  folderId: newRecord.folder_id as string | null,
                };

                const { notes } = get();
                if (!notes.some(note => note.id === newNote.id)) {
                  set(state => ({
                    notes: [newNote, ...state.notes],
                    lastSyncTimestamp: getCurrentTimestamp()
                  }));
                }
              } else if (eventType === 'UPDATE') {
                set(state => ({
                  notes: state.notes.map(note =>
                    note.id === newRecord.id
                      ? {
                          ...note,
                          title: newRecord.title as string,
                          content: newRecord.content as string || "",
                          updatedAt: newRecord.updated_at as string,
                          folderId: newRecord.folder_id as string | null,
                        }
                      : note
                  ),
                  lastSyncTimestamp: getCurrentTimestamp()
                }));
              } else if (eventType === 'DELETE') {
                const { activeNoteId } = get();
                const deletedNoteId = oldRecord.id as string;

                set(state => {
                  const filteredNotes = state.notes.filter(note => note.id !== deletedNoteId);
                  return {
                    notes: filteredNotes,
                    activeNoteId: activeNoteId === deletedNoteId
                      ? (filteredNotes.length > 0 ? filteredNotes[0].id : null)
                      : activeNoteId,
                    lastSyncTimestamp: getCurrentTimestamp()
                  };
                });
              }
            }, 200)
          );

          const folderChannel = folderSyncManager.subscribe(
            userId,
            debounce((payload: unknown) => {
              console.log('Realtime update for folders:', payload);

              const { eventType, new: newRecord, old: oldRecord } = payload as {
                eventType: string;
                new: Record<string, unknown>;
                old: Record<string, unknown>;
              };

              if (eventType === 'INSERT') {
                const newFolder: Folder = {
                  id: newRecord.id as string,
                  name: newRecord.name as string,
                  createdAt: newRecord.created_at as string,
                  parentId: newRecord.parent_id as string | null,
                };

                const { folders } = get();
                if (!folders.some(folder => folder.id === newFolder.id)) {
                  set(state => ({
                    folders: [...state.folders, newFolder],
                    lastSyncTimestamp: getCurrentTimestamp()
                  }));
                }
              } else if (eventType === 'UPDATE') {
                set(state => ({
                  folders: state.folders.map(folder =>
                    folder.id === newRecord.id
                      ? {
                          ...folder,
                          name: newRecord.name as string,
                          parentId: newRecord.parent_id as string | null,
                        }
                      : folder
                  ),
                  lastSyncTimestamp: getCurrentTimestamp()
                }));
              } else if (eventType === 'DELETE') {
                set(state => ({
                  folders: state.folders.filter(folder => folder.id !== oldRecord.id),
                  lastSyncTimestamp: getCurrentTimestamp()
                }));
              }
            }, 200)
          );

          realtimeChannels = { note: noteChannel, folder: folderChannel };

          set({ realtimeEnabled: true });
        },

        disableRealtime: () => {
          if (realtimeChannels) {
            try {
              supabase.removeChannel(realtimeChannels.note);
              supabase.removeChannel(realtimeChannels.folder);
              realtimeChannels = null;
              console.log("Real-time sync disabled in store");
            } catch (error: unknown) {
              console.error("Error removing channel:", error);
            }
          }
          set({ realtimeEnabled: false });
        },

        setActiveNoteId: (id) => {
          set({ activeNoteId: id });
        },

        createFolder: (name, userId) => {
          const newFolderId = createFolderLocal(name);
          set((state) => ({
            loadingStates: { ...state.loadingStates, createFolder: true },
            errorStates: { ...state.errorStates, createFolder: undefined },
          }));
          (async () => {
            try {
              const folder = get().folders.find((f) => f.id === newFolderId);
              if (folder) await createFolderService(folder, userId);
            } catch (error: unknown) {
              console.error("Error creating folder remotely:", error);
              set((state) => ({
                errorStates: {
                  ...state.errorStates,
                  createFolder:
                    (error instanceof Error ? error.message : String(error)) ||
                    "Failed to create folder remotely",
                },
              }));
            } finally {
              set((state) => ({
                loadingStates: { ...state.loadingStates, createFolder: false },
              }));
            }
          })();
          return Promise.resolve(newFolderId);
        },

        deleteFolder: async (id: string, userId: string) => {
          deleteFolderLocal(id);
          set((state) => ({
            loadingStates: { ...state.loadingStates, deleteFolder: true },
            errorStates: { ...state.errorStates, deleteFolder: undefined },
          }));
          try {
            await deleteFolderService(id, userId);
          } catch (error: unknown) {
            if (!navigator.onLine) {
              set(state => ({ pendingOperations: [...state.pendingOperations, { type: "deleteFolder", args: [id] }], errorStates: { ...state.errorStates, deleteFolder: "Offline - queued" } }));
              return;
            }
            console.error("Error deleting folder remotely:", error);
            set((state) => ({
              errorStates: { ...state.errorStates, deleteFolder: (error instanceof Error ? error.message : String(error)) || "Failed to delete folder remotely" },
            }));
          } finally {
            set((state) => ({
              loadingStates: { ...state.loadingStates, deleteFolder: false },
            }));
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

        resetStore: () => {
          set({
            notes: [],
            folders: [],
            activeNoteId: null,
            expandedFolders: { root: true },
            isSynced: false,
            lastSyncTimestamp: null,
            lastRealtimeUpdate: null,
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

        setupPresenceChannel: (userId: string) => {
          try {
            const channelName = `presence:${userId}`;
            const presenceChannel = supabase.channel(channelName, {
              config: {
                presence: {
                  key: userId,
                },
              },
            });

            presenceChannel
              .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                console.log('Presence sync:', state);
                // Optionally update Zustand store with presence state here
              })
              .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('User joined:', key, newPresences);
                // Optionally update Zustand store here
              })
              .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('User left:', key, leftPresences);
                // Optionally update Zustand store here
              })
              .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                  console.log('Presence channel subscribed');
                  const presenceTrackStatus = await presenceChannel.track({
                    user: userId,
                    online_at: new Date().toISOString(),
                  });
                  console.log('Presence track status:', presenceTrackStatus);
                } else if (status === 'CHANNEL_ERROR') {
                  console.error('Presence channel error');
                }
              });
          } catch (error: unknown) {
            console.error('Error setting up presence channel:', error);
          }
        },
        deleteNote: async (id: string, userId: string) => {
          deleteNoteLocal(id);
          set(state => ({ loadingStates: { ...state.loadingStates, deleteNote: true }, errorStates: { ...state.errorStates, deleteNote: undefined } }));
          try {
            await deleteNoteService(id, userId);
          } catch (error: unknown) {
            if (!navigator.onLine) {
              set(state => ({ pendingOperations: [...state.pendingOperations, { type: "deleteNote", args: [id] }], errorStates: { ...state.errorStates, deleteNote: "Offline - queued" } }));
              return;
            }
            console.error("Error deleting note remotely:", error);
            set(state => ({ errorStates: { ...state.errorStates, deleteNote: (error instanceof Error ? error.message : String(error)) || "Failed to delete note remotely" } }));
          } finally {
            set(state => ({ loadingStates: { ...state.loadingStates, deleteNote: false } }));
          }
        },
        // Create note locally and remotely
        createNote: async (folderId, userId) => {
          const newNoteId = createNoteLocal(folderId);
          set((state) => ({ loadingStates: { ...state.loadingStates, createNote: true }, errorStates: { ...state.errorStates, createNote: undefined } }));
          try {
            const note = get().notes.find(n => n.id === newNoteId);
            if (note) await createNoteService(note, userId);
          } catch (error: unknown) {
            if (!navigator.onLine) {
              set(state => ({ pendingOperations: [...state.pendingOperations, { type: "createNote", args: [newNoteId] }], errorStates: { ...state.errorStates, createNote: "Offline - queued" } }));
              return newNoteId;
            }
            console.error("Error creating note remotely:", error);
            set((state) => ({ errorStates: { ...state.errorStates, createNote: (error instanceof Error ? error.message : String(error)) || "Failed to create note remotely" } }));
          } finally {
            set((state) => ({ loadingStates: { ...state.loadingStates, createNote: false } }));
          }
          return newNoteId;
        },

        // Update note locally and remotely
        updateNote: async (noteId, data, userId) => {
          updateNoteLocal(noteId, data);
          set((state) => ({ loadingStates: { ...state.loadingStates, updateNote: true }, errorStates: { ...state.errorStates, updateNote: undefined } }));
          try {
            await updateNoteService(noteId, data, userId);
          } catch (error: unknown) {
            if (!navigator.onLine) {
              set(state => ({ pendingOperations: [...state.pendingOperations, { type: "updateNote", args: [noteId, data] }], errorStates: { ...state.errorStates, updateNote: "Offline - queued" } }));
              return;
            }
            console.error("Error updating note remotely:", error);
            set((state) => ({ errorStates: { ...state.errorStates, updateNote: (error instanceof Error ? error.message : String(error)) || "Failed to update note remotely" } }));
          } finally {
            set((state) => ({ loadingStates: { ...state.loadingStates, updateNote: false } }));
          }
        },

        // Move note locally and remotely
        moveNote: async (noteId, folderId, userId) => {
          moveNoteLocal(noteId, folderId);
          set((state) => ({ loadingStates: { ...state.loadingStates, moveNote: true }, errorStates: { ...state.errorStates, moveNote: undefined } }));
          try {
            await moveNoteService(noteId, folderId, userId);
          } catch (error: unknown) {
            if (!navigator.onLine) {
              set(state => ({ pendingOperations: [...state.pendingOperations, { type: "moveNote", args: [noteId, folderId] }], errorStates: { ...state.errorStates, moveNote: "Offline - queued" } }));
              return;
            }
            console.error("Error moving note remotely:", error);
            set((state) => ({ errorStates: { ...state.errorStates, moveNote: (error instanceof Error ? error.message : String(error)) || "Failed to move note remotely" } }));
          } finally {
            set((state) => ({ loadingStates: { ...state.loadingStates, moveNote: false } }));
          }
        },

        // Update folder locally and remotely
        updateFolder: async (id: string, data: Partial<Folder>, userId: string) => {
          updateFolderLocal(id, data);
          set((state) => ({
            loadingStates: { ...state.loadingStates, updateFolder: true },
            errorStates: { ...state.errorStates, updateFolder: undefined },
          }));
          try {
            await updateFolderService(id, data, userId);
          } catch (error: unknown) {
            if (!navigator.onLine) {
              set(state => ({ pendingOperations: [...state.pendingOperations, { type: "updateFolder", args: [id, data] }], errorStates: { ...state.errorStates, updateFolder: "Offline - queued" } }));
              return;
            }
            console.error("Error updating folder remotely:", error);
            set((state) => ({
              errorStates: {
                ...state.errorStates,
                updateFolder:
                  (error instanceof Error ? error.message : String(error)) ||
                  "Failed to update folder remotely",
              },
            }));
          } finally {
            set((state) => ({
              loadingStates: { ...state.loadingStates, updateFolder: false },
            }));
          }
        },

        updateNoteLocal,
        syncAll: async (userId: string) => {
          if (!get().hasHydrated) {
            console.log("Skipping sync until hydrated");
            return;
          }
          set(state => ({
            loadingStates: { ...state.loadingStates, sync: true },
            errorStates: { ...state.errorStates, sync: undefined },
          }));
          try {
            const since = get().lastSyncTimestamp;
            const { notes: newNotes, folders: newFolders } = await syncNotesAndFolders(
              userId,
              get().notes,
              get().folders,
              since || undefined
            );
            set(state => {
              const currentActive = state.activeNoteId;
              const newActive =
                currentActive && newNotes.some(n => n.id === currentActive)
                  ? currentActive
                  : newNotes[0]?.id ?? null;
              return {
                notes: newNotes,
                folders: newFolders,
                activeNoteId: newActive,
                isSynced: true,
                lastSyncTimestamp: getCurrentTimestamp(),
              };
            });
          } catch (error: unknown) {
            console.error("Error syncing notes and folders:", error);
            set(state => ({
              errorStates: { ...state.errorStates, sync: (error instanceof Error ? error.message : String(error)) || "Sync failed" },
            }));
          } finally {
            set(state => ({
              loadingStates: { ...state.loadingStates, sync: false },
            }));
          }
        },
      };
    },
    {
      name: "note-app-storage",
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated();
      },
    },
  ),
);

export default useNoteStore;
