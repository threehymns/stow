import { Button } from "@/components/ui/button";
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
  MoreHorizontal,
  FolderPlus,
  FilePlus,
  FolderUp,
  Trash2,
} from "lucide-react";
import { Folder } from "@/types/notes";

interface FolderContextMenuProps {
  folder: Folder;
  folders: Folder[];
  handleCreateFolder: (parentId: string | null) => void;
  handleCreateNote: (parentId: string | null) => void;
  updateFolder: (id: string, data: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  wouldCreateCycle: (folderId: string, targetParentId: string) => boolean;
}

export function FolderContextMenu({
  folder,
  folders,
  handleCreateFolder,
  handleCreateNote,
  updateFolder,
  deleteFolder,
  wouldCreateCycle,
}: FolderContextMenuProps) {
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
}
