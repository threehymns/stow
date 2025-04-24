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
import { settings as settingsDefinitions } from "@/store/settingsConfig";
import { SettingType } from "@/types/settings";
import { toast } from "sonner";
import { format } from "date-fns";
import { getThemeById } from "@/lib/themes";
import commandCenter, { useCommand } from "@/hooks/commandCenter";
import { Keybinding } from "@/components/ui/Keybinding";

/**
 * Displays a command palette UI for quickly accessing notes, folders, shortcuts, and settings.
 *
 * Provides a searchable interface with grouped commands for navigating notes, creating notes or folders, executing shortcut actions, and adjusting settings. Supports nested submenus for select-type settings and immediate toggling for toggle-type settings.
 *
 * @remark Prevents running multiple commands simultaneously to avoid conflicting actions.
 */
export function CommandBar() {
  const [open, setOpen] = useState(false);
  // toggle open via commandCenter event
  useCommand("commandBar", () => setOpen(o => !o));
  const [currentSubmenu, setCurrentSubmenu] = useState<SettingType | null>(null);
  const [isCommandRunning, setIsCommandRunning] = useState(false);
  const navigate = useNavigate();

  const {
    notes,
    folders,
    setActiveNoteId,
  } = useNoteStore();

  const { getSetting, setSetting } = useSettingsStore();

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

  // Find keybindings setting
  const keybindingsSetting = settingsDefinitions.find(
    (s) => s.id === 'keybindings' && s.type === 'keybindings'
  );

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
              onSelect={() => runCommand(() => commandCenter.emit('newNote'))}
            >
              <FilePlus className="mr-2 h-4 w-4" />
              <span>Create New Note</span>
              <CommandShortcut>
                <Keybinding command="newNote" />
              </CommandShortcut>
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
                        commandCenter.emit('newNote', folder.id);
                      })
                    }
                  >
                    <FolderPlus className="mr-2 h-4 w-4" />
                    <span>New note in {folder.name}</span>
                  </CommandItem>
                );
              })}
            <CommandItem
              onSelect={() => runCommand(() => commandCenter.emit('newFolder'))}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              <span>Create New Folder</span>
              <CommandShortcut>
                <Keybinding command="newFolder" />
              </CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Shortcut actions from settings */}
          <CommandGroup heading="Shortcuts">
            {keybindingsSetting?.actions.map((action) => (
              <CommandItem
                key={action.id}
                onSelect={() => runCommand(() => commandCenter.emit(action.id))}
              >
                <span>{action.label}</span>
                <CommandShortcut>
                  <Keybinding command={action.id} />
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

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
                    {'icon' in setting && setting.icon && (
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
                      setSetting(setting.id as any, !getSetting(setting.id as any));
                      setOpen(false);
                    }}
                  >
                    {'icon' in setting && setting.icon && (
                      <setting.icon className="mr-2 h-4 w-4" />
                    )}
                    <span>Toggle {setting.name}</span>
                    <CommandShortcut>
                      {getSetting(setting.id as any) ? "On" : "Off"}
                    </CommandShortcut>
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>

      {/* Submenu for settings */}
      <CommandDialog
        open={!!currentSubmenu}
        onOpenChange={() => setCurrentSubmenu(null)}
      >
        <CommandInput placeholder="Select an option..." />
        <CommandList>
          {currentSubmenu?.type === "select" && (
            <CommandGroup heading={currentSubmenu?.name}>
              {currentSubmenu.options.map((optionRaw) => {
                const option: { value: string; label?: string; icon?: LucideIcon } =
                  typeof optionRaw === "string"
                    ? { value: optionRaw }
                    : optionRaw as { value: string; label?: string; icon?: LucideIcon };

                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() =>
                      runCommand(() => {
                        setSetting(currentSubmenu.id as any, option.value);
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
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
