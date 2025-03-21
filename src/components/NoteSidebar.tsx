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

  // Create root folder if none exists
  useEffect(() => {
    if (folders.length === 0) {
      createFolder("All Notes", null);
    }
  }, [folders.length, createFolder]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
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

  const renderFolderContextMenu = (folder: Folder) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
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
                      Root
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

  const renderNoteContextMenu = (note: Note) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  Root
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

  const renderFolderContents = (parentId: string | null) => {
    const folderNotes = notes.filter((note) => note.folderId === parentId);
    const subfolders = folders.filter((folder) => folder.parentId === parentId);

    return (
      <div className="pl-0">
        {subfolders.map((folder) => renderFolder(folder))}

        {folderNotes.map((note) => (
          <div
            key={note.id}
            onClick={() => setActiveNoteId(note.id)}
            className={cn(
              "flex items-start rounded-md pl-2 pr-1 py-1 mb-1 cursor-pointer relative group note-transition hover:bg-sidebar-accent",
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
            {renderNoteContextMenu(note)}
          </div>
        ))}
      </div>
    );
  };

  const renderFolder = (folder: Folder) => {
    const isExpanded = expandedFolders[folder.id];

    return (
      <div key={folder.id} className="mb-1">
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleFolderExpanded(folder.id)}
        >
          <div className="flex items-center rounded-md pl-2 pr-1 py-1 cursor-pointer relative group hover:bg-sidebar-accent">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                <ChevronDown
                  size={14}
                  className={cn(
                    "transition-transform",
                    !isExpanded && "-rotate-90",
                  )}
                />
              </Button>
            </CollapsibleTrigger>

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

            <span className="text-xs font-medium truncate text-sidebar-foreground flex-1">
              {folder.name}
            </span>

            {renderFolderContextMenu(folder)}
          </div>

          <CollapsibleContent className="pl-4">
            {renderFolderContents(folder.id)}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  return (
    <>
      <div
        className={cn(
          "h-screen flex flex-col bg-sidebar border-r border-sidebar-border shadow-sm relative transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-72",
        )}
      >
        <div className="flex items-center justify-between p-4">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-sidebar-foreground animate-slide-in">
              Notes
            </h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="ml-auto"
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </Button>
        </div>

        <div className={cn("p-4", isCollapsed && "hidden")}>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 py-2 bg-sidebar-accent text-sidebar-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
            />
          </div>
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
                        className={cn(
                          "flex items-start rounded-md pl-2 pr-1 py-1 mb-1 cursor-pointer relative group hover:bg-sidebar-accent",
                          activeNoteId === note.id ? "bg-sidebar-accent" : "",
                        )}
                      >
                        <FileText
                          size={14}
                          className="mr-2 mt-0.5 text-sidebar-foreground"
                        />
                        <div className="overflow-hidden flex-1">
                          <h3 className="text-xs font-medium truncate text-sidebar-foreground">
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
                        {renderNoteContextMenu(note)}
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              // Normal folder structure
              <>{renderFolderContents(null)}</>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 flex space-x-2">
          <Button
            onClick={() => createNote(null)}
            className={cn(
              "transition-all duration-300 flex-1",
              isCollapsed ? "w-full p-2 justify-center" : "",
            )}
          >
            <Plus
              size={16}
              className={cn("flex-shrink-0", !isCollapsed && "mr-2")}
            />
            {!isCollapsed && <span>New Note</span>}
          </Button>

          {!isCollapsed && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFolderForNewItem(null);
                setNewFolderDialogOpen(true);
              }}
            >
              <FolderPlus size={16} className="mr-2" />
              <span>New Folder</span>
            </Button>
          )}
        </div>
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
