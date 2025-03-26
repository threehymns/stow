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
  Plus,
  Search,
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

type NewItemFormValues = {
  name: string;
};

export function NoteSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  let [isOpenBecauseHovered, setIsOpenBecauseHovered] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [selectedFolderForNewItem, setSelectedFolderForNewItem] = useState<
    string | null
  >(null);

  const { showNoteDates } = useSettingsStore();

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
  } = useNoteStore();

  const form = useForm<NewItemFormValues>({
    defaultValues: {
      name: "",
    },
  });

  const toggleSidebar = () => {
    if (isOpenBecauseHovered) {
      setIsOpenBecauseHovered(false);
      setIsCollapsed(false);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreateFolder = (data: NewItemFormValues) => {
    createFolder(data.name, selectedFolderForNewItem);
    setNewFolderDialogOpen(false);
    form.reset();
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
            className="h-6 w-6 p-0 absolute right-2 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              setSelectedFolderForNewItem(folder.id);
              setNewFolderDialogOpen(true);
            }}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => createNote(folder.id)}>
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
            className="h-4 w-6 p-0 opacity-0 group-hover:opacity-100"
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

  const FolderContents = (parentId: string | null) => {
    const folderNotes = notes.filter((note) => note.folderId === parentId);
    const subfolders = folders.filter((folder) => folder.parentId === parentId);

    return (
      <div className="pl-0">
        {subfolders.map((folder) => Folder(folder))}

        {folderNotes.map((note) => (
          <div
            key={note.id}
            onMouseDown={() => setActiveNoteId(note.id)}
            onClick={() => setActiveNoteId(note.id)}
            className={cn(
              "flex items-start rounded-md pl-2 pr-1 py-2 cursor-pointer relative group hover:bg-sidebar-accent",
              activeNoteId === note.id ? "bg-sidebar-accent" : "",
            )}
          >
            <FileText
              size={14}
              className="mr-2 mt-0.5 min-w-4 text-sidebar-foreground"
            />
            <div className="overflow-hidden flex-1">
              <h3 className="text-xs font-medium truncate text-sidebar-foreground">
                {note.title}
              </h3>
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
          <div className="flex items-center rounded-md pl-2 pr-1 cursor-pointer relative group hover:bg-sidebar-accent">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 transition-none"
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
            <CollapsibleTrigger asChild>
              <span className="py-2 text-xs font-medium truncate text-sidebar-foreground flex-1">
                {folder.name}
              </span>
            </CollapsibleTrigger>

            {FolderContextMenu(folder)}
          </div>
          <CollapsibleContent className="pl-4">
            {FolderContents(folder.id)}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  return (
    <>
      <div
        className={cn(
          "h-screen flex flex-col bg-sidebar border-r border-sidebar-border shadow-sm relative transition-all duration-300 ease-in-out select-none",
          isCollapsed ? "w-16" : "w-72",
        )}
        onMouseEnter={() => {
          if (isCollapsed ) { setIsOpenBecauseHovered(true) }
          setIsCollapsed(false)
        }}
        onMouseLeave={() => { isOpenBecauseHovered && setIsCollapsed(true); setIsOpenBecauseHovered(false) }}
      >
        <div
          className={cn(
            "flex items-center pt-4 justify-center",
            !isCollapsed && "justify-between",
          )}
        >
          {!isCollapsed && (
            <h2 className="mx-4 text-sm font-semibold text-sidebar-foreground animate-slide-in">
              MarkdownHive
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn("ml-auto", isCollapsed ? "mx-3" : "mx-4")}
          >
            {isCollapsed ? <PanelLeftOpen /> : isOpenBecauseHovered ? <Pin /> : <PanelLeftClose />}
          </Button>
        </div>

        <div
          className={cn(
            "flex justify-center py-2",
            !isCollapsed && "px-4 space-x-1",
          )}
        >
          <div
            className={cn("relative animate-slide-in", isCollapsed && "hidden")}
          >
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {!isCollapsed && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSelectedFolderForNewItem(null);
                setNewFolderDialogOpen(true);
              }}
              className="animate-slide-in shrink-0"
            >
              <FolderPlus />
              <span className="sr-only">New Folder</span>
            </Button>
          )}
          <Button
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                createNote(null);
                e.preventDefault();
              }
            }}
            onMouseDown={() => createNote(null)}
            size="icon"
            variant="outline"
            className="shrink-0"
          >
            <Plus />
            <span className="sr-only">New Note</span>
          </Button>
        </div>

        <Separator className="my-1" />

        <ScrollArea className="flex-1">
          <div className="p-2">
            {searchTerm ? (
              // Search results
              <div>
                {filteredFolders.length === 0 && filteredNotes.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">
                    No results found
                  </p>
                ) : (
                  <>
                    {filteredFolders.map((folder) => (
                      <div
                        key={folder.id}
                        className="flex items-center rounded-md pl-2 pr-1 py-1 mb-1 cursor-pointer relative group hover:bg-sidebar-accent"
                        onClick={() => toggleFolderExpanded(folder.id)}
                        onMouseDown={() => toggleFolderExpanded(folder.id)}
                      >
                        <FolderIcon
                          size={14}
                          className="mr-2 text-sidebar-foreground"
                        />
                        <span className="text-xs font-medium truncate text-sidebar-foreground">
                          {folder.name}
                        </span>
                      </div>
                    ))}

                    {filteredNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => setActiveNoteId(note.id)}
                        onMouseDown={() => setActiveNoteId(note.id)}
                        className={cn(
                          "flex items-start rounded-md pl-2 pr-1 mb-1 cursor-pointer relative group hover:bg-sidebar-accent",
                          activeNoteId === note.id ? "bg-sidebar-accent" : "",
                        )}
                      >
                        <FileText
                          size={14}
                          className="mr-2 mt-0.5 text-sidebar-foreground"
                        />
                        <div className="overflow-hidden flex-1">
                          <h3 className="py-2 text-xs font-medium truncate text-sidebar-foreground">
                            {note.title}
                          </h3>
                          {showNoteDates && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {format(
                                new Date(note.updatedAt),
                                "MMM d, h:mm a",
                              )}
                            </p>
                          )}
                        </div>
                        {NoteContextMenu(note)}
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              // Normal folder structure
              <>{FolderContents(null)}</>
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateFolder)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Folder name" {...field} autoFocus />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNewFolderDialogOpen(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
