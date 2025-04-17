import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useNoteStore from "@/store/noteStore";
import { FolderPlus, Plus, Loader2 } from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { FolderItem } from "./FolderItem";
import { NoteItem } from "./NoteItem";
import { AuthStatus } from "../auth/AuthStatus";
import { useAuth } from "@/contexts/AuthContext";

export function NoteSidebar() {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const {
    notes,
    folders,
    activeNoteId,
    expandedFolders,
    isLoading,
    setActiveNoteId,
    createNote,
    deleteNote,
    createFolder,
    updateFolder,
    deleteFolder,
    toggleFolderExpanded,
    moveNote,
    updateNote,
  } = useNoteStore();

  const { user } = useAuth();

  // Wrapper for folder updates (optimistic + remote)
  const handleUpdateFolder = (id, data) => {
    if (!user?.id) {
      console.error("User ID missing, cannot update folder remotely");
      return;
    }
    updateFolder(id, data, user.id);
  };

  // Handler for deleting a folder (remote + local)
  const handleDeleteFolder = (id: string) => {
    if (!user?.id) {
      console.error("User ID missing, cannot delete folder remotely");
      return;
    }
    deleteFolder(id, user.id);
  };

  const handleCreateFolder = async (parentId: string | null) => {
    if (!user?.id) {
      console.error("User ID missing, cannot create folder remotely");
      return;
    }
    const newFolderId = await createFolder("New Folder", user.id);
    setEditingItemId(newFolderId);
    const untitledCount = folders.filter(
      (n) => n.parentId === parentId && n.name.startsWith("New Folder"),
    ).length;
    setEditingName(`New Folder ${untitledCount + 1}`);
  };

  const handleCreateNote = async (parentId: string | null) => {
    if (!user?.id) {
      console.error("User ID missing, cannot create remotely");
      return;
    }
    const newNoteId = await createNote(parentId, user.id);
    setEditingItemId(newNoteId);
    const untitledCount = notes.filter(
      (n) => n.folderId === parentId && n.title.startsWith("Untitled Note"),
    ).length;
    setEditingName(`Untitled Note ${untitledCount + 1}`);
  };

  // Helper to get all child folder IDs (recursively)
  const getChildFolderIds = (parentId: string | null): string[] => {
    const directChildren = folders.filter((f) => f.parentId === parentId);
    return [
      ...directChildren.map((f) => f.id),
      ...directChildren.flatMap((f) => getChildFolderIds(f.id)),
    ];
  };

  // Helper to check if moving a folder would create a cycle
  const wouldCreateCycle = (
    folderId: string,
    targetParentId: string,
  ): boolean => {
    if (folderId === targetParentId) return true;
    const childIds = getChildFolderIds(folderId);
    return childIds.includes(targetParentId);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItemId) return;

    const folder = folders.find((f) => f.id === editingItemId);
    if (folder) {
      handleUpdateFolder(editingItemId, { name: editingName });
    } else {
      if (user?.id) {
        updateNote(editingItemId, { title: editingName }, user.id).catch(
          (error) => console.error("Failed to update note title:", error),
        );
      } else {
        console.error("User ID missing, cannot update remotely");
      }
    }
    setEditingItemId(null);
  };

  // Render root-level folders and notes
  const rootFolders = folders.filter((folder) => folder.parentId === null);
  const rootNotes = notes.filter((note) => note.folderId === null);

  // Cast expandedFolders to a Record<string, boolean> to ensure type safety
  const typedExpandedFolders: Record<string, boolean> = Object.entries(expandedFolders).reduce(
    (acc, [key, value]) => {
      acc[key] = Boolean(value);
      return acc;
    },
    {} as Record<string, boolean>
  );

  return (
    <Sidebar>
      <SidebarHeader className="flex-row items-center pt-2 justify-end px-2 py-1.5">
        {isLoading ? (
          <div className="flex items-center text-muted-foreground text-xs">
            <Loader2 size={16} className="animate-spin mr-2" />
            Syncing...
          </div>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCreateFolder(null)}
            >
              <FolderPlus />
              <span className="sr-only">New Folder</span>
            </Button>
            <Button
              onClick={() => handleCreateNote(null)}
              size="icon"
              variant="outline"
            >
              <Plus />
              <span className="sr-only">New Note</span>
            </Button>
          </>
        )}
      </SidebarHeader>

      <Separator className="my-1" />

      <SidebarContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Loader2 size={24} className="animate-spin mb-2" />
            <p className="text-sm">Syncing your notes...</p>
          </div>
        ) : notes.length === 0 && folders.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm mb-2">You don't have any notes yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCreateNote(null)}
              className="mx-auto"
            >
              <Plus size={16} className="mr-1" />
              Create your first note
            </Button>
          </div>
        ) : (
          <div className="p-2 select-none">
            <div className="pl-0 space-y-0.5">
              {rootFolders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  notes={notes}
                  folders={folders}
                  activeNoteId={activeNoteId}
                  expandedFolders={typedExpandedFolders}
                  editingItemId={editingItemId}
                  editingName={editingName}
                  toggleFolderExpanded={toggleFolderExpanded}
                  handleCreateFolder={handleCreateFolder}
                  handleCreateNote={handleCreateNote}
                  setEditingItemId={setEditingItemId}
                  setEditingName={setEditingName}
                  handleRenameSubmit={handleRenameSubmit}
                  updateFolder={handleUpdateFolder}
                  deleteFolder={handleDeleteFolder}
                  setActiveNoteId={setActiveNoteId}
                  moveNote={async (noteId, folderId) => {
                    if (user?.id) {
                      await moveNote(noteId, folderId, user.id);
                    } else {
                      console.error("User ID missing, cannot move remotely");
                    }
                  }}
                  deleteNote={async (noteId) => {
                    if (user?.id) {
                      await deleteNote(noteId, user.id);
                    } else {
                      console.error("User ID missing, cannot delete remotely");
                    }
                  }}
                  wouldCreateCycle={wouldCreateCycle}
                />
              ))}

              {rootNotes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  activeNoteId={activeNoteId}
                  editingItemId={editingItemId}
                  editingName={editingName}
                  folders={folders}
                  setActiveNoteId={setActiveNoteId}
                  setEditingItemId={setEditingItemId}
                  setEditingName={setEditingName}
                  handleRenameSubmit={handleRenameSubmit}
                  moveNote={async (noteId, folderId) => {
                    if (user?.id) {
                      await moveNote(noteId, folderId, user.id);
                    } else {
                      console.error("User ID missing, cannot move remotely");
                    }
                  }}
                  deleteNote={async (noteId) => {
                    if (user?.id) {
                      await deleteNote(noteId, user.id);
                    } else {
                      console.error("User ID missing, cannot delete remotely");
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <div className="p-1 rounded-lg flex items-center">
          <AuthStatus />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
