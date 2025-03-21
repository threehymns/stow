import { useState, useEffect, createElement } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Monitor } from "lucide-react";
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
import { FileText, File, FolderPlus, FilePlus, Icon } from "lucide-react";
import useNoteStore from "@/store/noteStore";
import { settings, useSettingsStore } from "@/store/settingsStore";
import { SettingType } from "@/types/settings";
import { toast } from "sonner";
import { Toggle } from "./ui/toggle";
import { Box } from "framer-motion";
import { Switch } from "@radix-ui/react-switch";

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [currentSubmenu, setCurrentSubmenu] = useState<SettingType | null>(
    null,
  );
  const navigate = useNavigate();

  const { notes, folders, setActiveNoteId, createNote, createFolder } =
    useNoteStore();
  const { getSetting, setSetting } = useSettingsStore();

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

  const folderItems = folders.map((folder) => ({
    id: folder.id,
    name: folder.id,
    type: "folder",
  }));

  const handleCommandSelection = (commandName: SettingType) => {
    setCurrentSubmenu(commandName); // Open submenu directly
    setOpen(false);
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
                <span className="ml-auto text-xs text-muted-foreground">
                  {note.createdAt}
                </span>
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
                      toast(`New note created in ${folder.id}`);
                    })
                  }
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  <span>New note in {folder.id}</span>
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
            {settings
              .filter((s) => s.type === "select")
              .map((setting) => (
                <CommandItem
                  key={setting.id}
                  onSelect={() => handleCommandSelection(setting)}
                >
                  <setting.icon className="mr-2 h-4 w-4" />
                  <span>{setting.name}</span>
                </CommandItem>
              ))}
            {settings
              .filter((s) => s.type === "toggle")
              .map((setting) => (
                <CommandItem
                  key={setting.id}
                  onSelect={() => {
                    setSetting(setting.id, !getSetting(setting.id));
                    setOpen(false);
                  }}
                >
                  <setting.icon className="mr-2 h-4 w-4" />
                  <span>Toggle {setting.name}</span>
                  <CommandShortcut>
                    {getSetting(setting.id) ? "On" : "Off"}
                  </CommandShortcut>
                </CommandItem>
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
              currentSubmenu.options.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() =>
                    runCommand(() => {
                      setSetting(currentSubmenu.id, option);
                      toast(`${currentSubmenu.name} set to ${option}`);
                    })
                  }
                >
                  <span>{option}</span>
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
