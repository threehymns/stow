import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useForm } from "react-hook-form";
import useNoteStore from "@/store/noteStore";
import useSettingsStore from "@/store/settingsStore";
import { Folder, Note } from "@/types/notes";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  File,
  FileText,
  Folder as FolderIcon,
  FolderPlus,
  FolderOpen,
  MoreVertical,
  MoreHorizontal,
  Plus,
  Trash2,
  FilePlus,
  FolderUp,
  PanelLeftOpen,
  PanelLeftClose,
  Pin,
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type NewItemFormValues = {
  name: string;
};

export function NoteSidebar() {
  const { showNoteDates } = useSettingsStore();

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const {
    notes,
    folders,
    activeNoteId,
    expandedFolders,
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

  const form = useForm<NewItemFormValues>({
    defaultValues: {
      name: "",
    },
  });

  const handleCreateFolder = (parentId: string | null) => {
    const newFolderId = createFolder("New Folder", parentId);
    setEditingItemId(newFolderId);
    const untitledCount = folders.filter(
      (n) => n.parentId === parentId && n.name.startsWith("New Folder"),
    ).length;
    setEditingName(`New Folder ${untitledCount + 1}`);
  };

  const handleCreateNote = (parentId: string | null) => {
    const newNoteId = createNote(parentId);
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

  const FolderContextMenu = (folder: Folder) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => handleCreateFolder(folder.id)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCreateNote(folder.id)}>
            <FilePlus className="mr-2 h-4 w-4" />
            New Note
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          {folder.id !== "root" && (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderUp className="mr-2 h-4 w-4" />
                  Move to Folder
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => {
                        updateFolder(folder.id, { parentId: null });
                      }}
                    >
                      All Notes
                    </DropdownMenuItem>
                    {folders
                      .filter(
                        (f) =>
                          f.id !== folder.id &&
                          !wouldCreateCycle(folder.id, f.id),
                      )
                      .map((targetFolder) => (
                        <DropdownMenuItem
                          key={targetFolder.id}
                          onClick={() => {
                            updateFolder(folder.id, {
                              parentId: targetFolder.id,
                            });
                          }}
                        >
                          {targetFolder.name}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => deleteFolder(folder.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Folder
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const NoteContextMenu = (note: Note) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderUp className="mr-2 h-4 w-4" />
              Move to Folder
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => moveNote(note.id, null)}>
                  All Notes
                </DropdownMenuItem>
                {folders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => moveNote(note.id, folder.id)}
                  >
                    {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => deleteNote(note.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Note
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItemId) return;

    const folder = folders.find((f) => f.id === editingItemId);
    if (folder) {
      updateFolder(editingItemId, { name: editingName });
    } else {
      updateNote(editingItemId, { title: editingName });
    }
    setEditingItemId(null);
  };

  const FolderContents = (parentId: string | null) => {
    const folderNotes = notes.filter((note) => note.folderId === parentId);
    const subfolders = folders.filter((folder) => folder.parentId === parentId);

    return (
      <div className="pl-0 space-y-0.5">
        {subfolders.map((folder) => Folder(folder))}

        {folderNotes.map((note) => (
          <div
            key={note.id}
            onMouseDown={() => setActiveNoteId(note.id)}
            onClick={() => setActiveNoteId(note.id)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingItemId(note.id);
              setEditingName(note.title);
            }}
            className={cn(
              "flex items-start rounded-md pl-2 pr-1 py-2 relative group/item hover:bg-sidebar-accent",
              activeNoteId === note.id ? "bg-sidebar-accent" : "",
            )}
          >
            <FileText
              size={14}
              className="mr-2 mt-0.5 min-w-4 text-sidebar-foreground"
            />
            <div className="flex-1 w-2">
              {editingItemId === note.id ? (
                <input
                  ref={editInputRef}
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRenameSubmit(e);
                    }
                  }}
                  onBlur={handleRenameSubmit}
                  className="text-xs bg-sidebar block focus:outline-none ring-1 ring-offset-1 ring-offset-sidebar-accent ring-sidebar-border font-bold rounded-sm w-full"
                  autoFocus
                />
              ) : (
                <h3 className="text-xs font-medium truncate text-sidebar-foreground">
                  {note.title}
                </h3>
              )}
              {showNoteDates && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {format(new Date(note.updatedAt), "MMM d, h:mm a")}
                </p>
              )}
            </div>
            {NoteContextMenu(note)}
          </div>
        ))}
      </div>
    );
  };

  const Folder = (folder: Folder) => {
    const isExpanded = expandedFolders[folder.id];

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
              <input
                ref={editInputRef}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenameSubmit(e);
                  }
                }}
                onBlur={handleRenameSubmit}
                className="my-2 text-xs bg-sidebar block focus:outline-none ring-1 ring-offset-1 ring-offset-sidebar-accent ring-sidebar-border font-bold rounded-sm flex-1"
                autoFocus
              />
            ) : (
              <CollapsibleTrigger asChild>
                <span className="py-2 w-2 text-xs font-medium truncate text-sidebar-foreground flex-1">
                  {folder.name}
                </span>
              </CollapsibleTrigger>
            )}

            <div className="h-6 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 space-x-0.5 *:h-6 *:w-6 *:p-0">
              {FolderContextMenu(folder)}
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
            {FolderContents(folder.id)}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  return (
    <Sidebar>
      <SidebarHeader className="flex-row items-center pt-2 justify-end px-2 py-1.5">
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
      </SidebarHeader>

      <Separator className="my-1" />

      <SidebarContent>
        <div className="p-2 select-none">{FolderContents(null)}</div>
      </SidebarContent>
    </Sidebar>
  );
}
