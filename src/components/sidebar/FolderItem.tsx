
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  FolderIcon,
  FolderOpen,
  FolderPlus,
  Plus,
} from "lucide-react";
import { Folder, Note } from "@/types/notes";
import { EditableItem } from "./EditableItem";
import { FolderContextMenu } from "./FolderContextMenu";
import { NoteItem } from "./NoteItem";

interface FolderItemProps {
  folder: Folder;
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  expandedFolders: Record<string, boolean>;
  editingItemId: string | null;
  editingName: string;
  showNoteDates: boolean;
  toggleFolderExpanded: (folderId: string) => void;
  handleCreateFolder: (parentId: string | null) => void;
  handleCreateNote: (parentId: string | null) => void;
  setEditingItemId: (id: string | null) => void;
  setEditingName: (name: string) => void;
  handleRenameSubmit: (e: React.FormEvent) => void;
  updateFolder: (id: string, data: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  setActiveNoteId: (id: string | null) => void;
  moveNote: (noteId: string, folderId: string | null) => void;
  deleteNote: (id: string) => void;
  wouldCreateCycle: (folderId: string, targetParentId: string) => boolean;
}

export function FolderItem({
  folder,
  notes,
  folders,
  activeNoteId,
  expandedFolders,
  editingItemId,
  editingName,
  showNoteDates,
  toggleFolderExpanded,
  handleCreateFolder,
  handleCreateNote,
  setEditingItemId,
  setEditingName,
  handleRenameSubmit,
  updateFolder,
  deleteFolder,
  setActiveNoteId,
  moveNote,
  deleteNote,
  wouldCreateCycle,
}: FolderItemProps) {
  // Ensure isExpanded is a boolean
  const isExpanded = !!expandedFolders[folder.id];
  
  // Find child folders and notes
  const subfolders = folders.filter((f) => f.parentId === folder.id);
  const folderNotes = notes.filter((note) => note.folderId === folder.id);

  return (
    <div key={folder.id}>
      <Collapsible
        open={isExpanded}
        onOpenChange={() => toggleFolderExpanded(folder.id)}
      >
        <div
          className="flex items-center rounded-md pl-2 pr-1 relative group/item hover:bg-sidebar-accent mb-0.5"
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (folder.id !== "root") {
              setEditingItemId(folder.id);
              setEditingName(folder.name);
            }
          }}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-3 h-4 w-4 p-0 transition-none opacity-0 group-hover/item:opacity-100"
            >
              <ChevronDown
                size={14}
                className={cn(
                  "transition-transform",
                  !isExpanded && "-rotate-90",
                )}
              />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleTrigger asChild>
            {isExpanded ? (
              <FolderOpen
                size={14}
                className="mr-2 ml-1 text-sidebar-foreground"
              />
            ) : (
              <FolderIcon
                size={14}
                className="mr-2 ml-1 text-sidebar-foreground"
              />
            )}
          </CollapsibleTrigger>

          {editingItemId === folder.id ? (
            <EditableItem
              value={editingName}
              onChange={setEditingName}
              onSubmit={handleRenameSubmit}
            />
          ) : (
            <CollapsibleTrigger asChild>
              <span className="py-2 w-2 text-xs font-medium truncate text-sidebar-foreground flex-1">
                {folder.name}
              </span>
            </CollapsibleTrigger>
          )}

          <div className="h-6 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 space-x-0.5 *:h-6 *:w-6 *:p-0">
            <FolderContextMenu
              folder={folder}
              folders={folders}
              handleCreateFolder={handleCreateFolder}
              handleCreateNote={handleCreateNote}
              updateFolder={updateFolder}
              deleteFolder={deleteFolder}
              wouldCreateCycle={wouldCreateCycle}
            />
            <Button
              onClick={() => handleCreateFolder(folder.id)}
              variant="ghost"
              title="New Folder"
            >
              <FolderPlus />
            </Button>
            <Button
              onClick={() => handleCreateNote(folder.id)}
              variant="ghost"
              title="New Note"
            >
              <Plus />
            </Button>
          </div>
        </div>
        <CollapsibleContent className="pl-4">
          <div className="pl-0 space-y-0.5">
            {/* Render subfolders recursively */}
            {subfolders.map((subfolder) => (
              <FolderItem
                key={subfolder.id}
                folder={subfolder}
                notes={notes}
                folders={folders}
                activeNoteId={activeNoteId}
                expandedFolders={expandedFolders}
                editingItemId={editingItemId}
                editingName={editingName}
                showNoteDates={showNoteDates}
                toggleFolderExpanded={toggleFolderExpanded}
                handleCreateFolder={handleCreateFolder}
                handleCreateNote={handleCreateNote}
                setEditingItemId={setEditingItemId}
                setEditingName={setEditingName}
                handleRenameSubmit={handleRenameSubmit}
                updateFolder={updateFolder}
                deleteFolder={deleteFolder}
                setActiveNoteId={setActiveNoteId}
                moveNote={moveNote}
                deleteNote={deleteNote}
                wouldCreateCycle={wouldCreateCycle}
              />
            ))}

            {/* Render notes */}
            {folderNotes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                activeNoteId={activeNoteId}
                editingItemId={editingItemId}
                editingName={editingName}
                showNoteDates={showNoteDates}
                folders={folders}
                setActiveNoteId={setActiveNoteId}
                setEditingItemId={setEditingItemId}
                setEditingName={setEditingName}
                handleRenameSubmit={handleRenameSubmit}
                moveNote={moveNote}
                deleteNote={deleteNote}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
