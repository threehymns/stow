import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  FileText,
  Search,
  Settings,
  File,
  FolderPlus,
  FilePlus,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import useNoteStore from "@/store/noteStore";
import useSettingsStore from "@/store/settingsStore";
import { toast } from "sonner";

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [currentSubmenu, setCurrentSubmenu] = useState(null);
  const navigate = useNavigate();

  const { notes, folders, setActiveNoteId, createNote, createFolder } =
    useNoteStore();
  const { theme, setTheme, showNoteDates, setShowNoteDates } =
    useSettingsStore();

  // Setup keyboard shortcut listener
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

  const runCommand = (command: () => void) => {
    command();
    setOpen(false);
  };

  // Get all note titles for search
  const noteItems = notes.map((note) => ({
    id: note.id,
    name: note.title,
    type: "note",
  }));

  // Get all folder names for search
  const folderItems = folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    type: "folder",
  }));

  // Combined searchable items
  const searchableItems = [...noteItems, ...folderItems];

  const settingsCommands = [
    { name: "Theme", options: ["light", "dark", "system"] },
    { name: "Show Note Dates", options: ["true", "false"] },
    // Add more settings as needed
  ];

  const handleCommandSelection = (commandName: string) => {
    const command = settingsCommands.find((cmd) => cmd.name === commandName);
    if (command) {
      // Open command dialog to show options for the selected command
      setOpen(true);
      // Set the current command to display its options
      setCurrentSubmenu(command);
    }
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Notes">
            {noteItems.slice(0, 5).map((note) => (
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
                <span>{note.name}</span>
                <span className="hidden">{note.id}</span>
              </CommandItem>
            ))}
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  createNote();
                  toast("New note created");
                })
              }
            >
              <FilePlus className="mr-2 h-4 w-4" />
              <span>Create New Note</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Folders">
            {folderItems
              .filter((f) => f.id !== "root")
              .slice(0, 3)
              .map((folder) => (
                <CommandItem
                  key={folder.id}
                  onSelect={() =>
                    runCommand(() => {
                      createNote(folder.id);
                      toast(`New note created in ${folder.name}`);
                    })
                  }
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  <span>New note in {folder.name}</span>
                </CommandItem>
              ))}
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  const name = `New Folder ${folders.length}`;
                  createFolder(name);
                  toast("New folder created");
                })
              }
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              <span>Create New Folder</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Settings">
            {settingsCommands.map((command) => (
              <CommandItem
                key={command.name}
                onSelect={() => handleCommandSelection(command.name)}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>{command.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />
        </CommandList>
      </CommandDialog>
      <CommandDialog
        open={currentSubmenu !== null}
        onOpenChange={() => setCurrentSubmenu(null)}
      >
        <CommandInput placeholder="Select an option or type..." />
        <CommandList>
          {currentSubmenu && (
            <CommandGroup heading={currentSubmenu.name}>
              {currentSubmenu.options.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() =>
                    runCommand(() => {
                      if (currentSubmenu.name === "Theme") {
                        setTheme(option as "light" | "dark" | "system");
                        toast(
                          `${option.charAt(0).toUpperCase() + option.slice(1)} theme activated`,
                        );
                      } else if (currentSubmenu.name === "Show Note Dates") {
                        setShowNoteDates(option === "true");
                        toast(
                          `Note dates ${option === "true" ? "shown" : "hidden"}`,
                        );
                      }
                    })
                  }
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
