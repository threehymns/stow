
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
  const navigate = useNavigate();
  
  const { notes, folders, setActiveNoteId, createNote, createFolder } = useNoteStore();
  const { theme, setTheme, showNoteDates, setShowNoteDates } = useSettingsStore();

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
  const noteItems = notes.map(note => ({
    id: note.id,
    name: note.title,
    type: "note"
  }));

  // Get all folder names for search
  const folderItems = folders.map(folder => ({
    id: folder.id,
    name: folder.name,
    type: "folder"
  }));

  // Combined searchable items
  const searchableItems = [...noteItems, ...folderItems];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Notes">
          {noteItems.slice(0, 5).map((note) => (
            <CommandItem
              key={note.id}
              onSelect={() => runCommand(() => {
                setActiveNoteId(note.id);
                navigate("/");
              })}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>{note.name}</span>
            </CommandItem>
          ))}
          <CommandItem onSelect={() => runCommand(() => {
            createNote();
            toast("New note created");
          })}>
            <FilePlus className="mr-2 h-4 w-4" />
            <span>Create New Note</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Folders">
          {folderItems.filter(f => f.id !== 'root').slice(0, 3).map((folder) => (
            <CommandItem
              key={folder.id}
              onSelect={() => runCommand(() => {
                createNote(folder.id);
                toast(`New note created in ${folder.name}`);
              })}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              <span>New note in {folder.name}</span>
            </CommandItem>
          ))}
          <CommandItem onSelect={() => runCommand(() => {
            const name = `New Folder ${folders.length}`;
            createFolder(name);
            toast("New folder created");
          })}>
            <FolderPlus className="mr-2 h-4 w-4" />
            <span>Create New Folder</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => navigate("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Open Settings</span>
          </CommandItem>
          
          <CommandItem onSelect={() => runCommand(() => {
            setTheme("light");
            toast("Light theme activated");
          })}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Theme</span>
          </CommandItem>
          
          <CommandItem onSelect={() => runCommand(() => {
            setTheme("dark");
            toast("Dark theme activated");
          })}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Theme</span>
          </CommandItem>
          
          <CommandItem onSelect={() => runCommand(() => {
            setTheme("system");
            toast("System theme activated");
          })}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>System Theme</span>
          </CommandItem>
          
          <CommandItem onSelect={() => runCommand(() => {
            setShowNoteDates(!showNoteDates);
            toast(`Note dates ${showNoteDates ? "hidden" : "shown"}`);
          })}>
            <FileText className="mr-2 h-4 w-4" />
            <span>{showNoteDates ? "Hide" : "Show"} Note Dates</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Search Results">
          {searchableItems.length > 10 && (
            <CommandItem onSelect={() => setOpen(true)} className="italic text-muted-foreground">
              <Search className="mr-2 h-4 w-4" />
              <span>Type to search all notes and folders...</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
