import { useState, useEffect, createElement } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { FileText, FolderPlus, FilePlus, LucideIcon } from "lucide-react";
import useNoteStore from "@/store/noteStore";
import ThemePreviewCircle from "@/components/ThemePreviewCircle";
import {
  useSettingsStore,
} from "@/store/settingsStore";
import { getGroupedSettings, type GroupedSettings } from "@/store/settingsConfig";
import { SettingType } from "@/types/settings";
import { toast } from "sonner";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { getCurrentTimestamp, createNote as createNoteService, createFolder as createFolderService } from "@/services/noteService";
import { useAuth } from "@/contexts/AuthContext"; // Assuming this exists
import { Note, Folder } from "@/types/notes";
import { getThemeById } from "@/lib/themes";

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [currentSubmenu, setCurrentSubmenu] = useState<SettingType | null>(null);
  const [isCommandRunning, setIsCommandRunning] = useState(false);
  const navigate = useNavigate();

  const {
    notes,
    folders,
    setActiveNoteId,
    createNote,
    createFolder,
  } = useNoteStore();

  const { getSetting, setSetting } = useSettingsStore();
  const { user } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Reset isCommandRunning when dialog is reopened
  useEffect(() => {
    if (open) {
      setIsCommandRunning(false);
    }
  }, [open]);

  const runCommand = async (command: () => void | Promise<void>) => {
    if (isCommandRunning) return;
    setIsCommandRunning(true);
    await command();
    setOpen(false);
    setIsCommandRunning(false);
  };

  const handleCommandSelection = (commandName: SettingType) => {
    setCurrentSubmenu(commandName);
    setOpen(false);
  };

  // Group settings by category
  const groupedSettings: GroupedSettings = getGroupedSettings();

  const handleCreateNote = async (folderId: string | null = null) => {
    const now = getCurrentTimestamp();
    const newNote: Note = {
      id: uuidv4(),
      title: "Untitled Note",
      content: "",
      createdAt: now,
      updatedAt: now,
      folderId,
    };

    try {
      if (user?.id) {
        await createNote(folderId, user.id);
        toast.success("New note created");
      } else {
        console.error("User ID missing, cannot create remotely");
      }
    } catch (error: unknown) {
      console.error("Failed to create note:", error instanceof Error ? error.message : error);
      toast.error("Failed to create note");
    }
  };

  const handleCreateFolder = async () => {
    try {
      if (user?.id) {
        await createFolder(`New Folder ${folders.length}`, user.id);
        toast.success("New folder created");
      } else {
        console.error("User ID missing, cannot create folder remotely");
        toast.error("Failed to create folder");
      }
    } catch (error: unknown) {
      console.error("Failed to create folder:", error instanceof Error ? error.message : error);
      toast.error("Failed to create folder");
    }
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Notes">
            {notes.slice(0, 5).map((note) => (
              <CommandItem
                key={note.id}
                onSelect={() =>
                  runCommand(() => {
                    setActiveNoteId(note.id);
                    navigate("/");
                  })
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>{note.title}</span>
                <span className="hidden">{note.id}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {format(new Date(note.createdAt), "MMM d, h:mm a")}
                </span>
              </CommandItem>
            ))}
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  handleCreateNote();
                })
              }
            >
              <FilePlus className="mr-2 h-4 w-4" />
              <span>Create New Note</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Folders">
            {folders
              .filter((f) => f.id !== "root")
              .slice(0, 3)
              .map((folder) => {
                return (
                  <CommandItem
                    key={folder.id}
                    onSelect={() =>
                      runCommand(() => {
                        handleCreateNote(folder.id);
                      })
                    }
                  >
                    <FolderPlus className="mr-2 h-4 w-4" />
                    <span>New note in {folder.name}</span>
                  </CommandItem>
                );
              })}
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  handleCreateFolder();
                })
              }
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              <span>Create New Folder</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Settings">
            {Object.entries(groupedSettings).map(([categoryId, category]) => (
              <CommandGroup
                key={categoryId}
                heading={category._category?.name || categoryId}
              >
                {category.settings
                  .filter((s) => s.type === "select")
                  .map((setting) => (
                    <CommandItem
                      key={setting.id}
                      onSelect={() => handleCommandSelection(setting)}
                    >
                      {setting.icon && (
                        <setting.icon className="mr-2 h-4 w-4" />
                      )}
                      <span>{setting.name}</span>
                    </CommandItem>
                  ))}
                {category.settings
                  .filter((s) => s.type === "toggle")
                  .map((setting) => (
                    <CommandItem
                      key={setting.id}
                      onSelect={() => {
                        setSetting(setting.id, !getSetting(setting.id));
                        setOpen(false);
                      }}
                    >
                      {setting.icon && (
                        <setting.icon className="mr-2 h-4 w-4" />
                      )}
                      <span>Toggle {setting.name}</span>
                      <CommandShortcut>
                        {getSetting(setting.id) ? "On" : "Off"}
                      </CommandShortcut>
                    </CommandItem>
                  ))}
              </CommandGroup>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Submenu for settings */}
      <CommandDialog
        open={!!currentSubmenu}
        onOpenChange={() => setCurrentSubmenu(null)}
      >
        <CommandInput placeholder="Select an option..." />
        <CommandList>
          <CommandGroup heading={currentSubmenu?.name}>
            {currentSubmenu?.type === "select" &&
              currentSubmenu.options.map((optionRaw) => {
                const option: { value: string; label?: string; icon?: LucideIcon } =
                  typeof optionRaw === "string"
                    ? { value: optionRaw }
                    : optionRaw as { value: string; label?: string; icon?: LucideIcon };

                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() =>
                      runCommand(() => {
                        setSetting(currentSubmenu.id, option.value);
                        toast(`${currentSubmenu.name} set to ${option.value}`);
                      })
                    }
                  >
                    {option.icon &&
                      createElement(option.icon, { className: "mr-2 h-4 w-4" })}
                    {currentSubmenu?.id === "colorTheme" && (
                      <ThemePreviewCircle
                        theme={getThemeById(option.value)}
                        className="h-4 w-4"
                      />
                    )}
                    <span>{option.label ?? option.value}</span>
                  </CommandItem>
                );
              })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
