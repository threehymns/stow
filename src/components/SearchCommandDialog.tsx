import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import useNoteStore from "@/store/noteStore";
import commandCenter from "@/hooks/commandCenter";
import { toast } from "sonner";

/**
 * Displays a searchable command dialog for quickly finding and opening notes.
 *
 * The dialog can be toggled with the Ctrl+K or Cmd+K keyboard shortcut, or opened via a "searchNotes" event from the command center. Users can search notes by title or content, and selecting a note sets it as active and shows a success notification.
 *
 * @remark Note content previews are sanitized to remove HTML tags before display.
 */
export function SearchCommandDialog() {
  const [open, setOpen] = useState(false);
  const { notes, setActiveNoteId } = useNoteStore();
  const [searchResults, setSearchResults] = useState<typeof notes>([]);

  useEffect(() => {
    // Register command handler for Ctrl+K
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Register with command center
  useEffect(() => {
    commandCenter.on("searchNotes", () => setOpen(true));
    return () => {
      commandCenter.off("searchNotes", () => setOpen(true));
    };
  }, []);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }

    const results = notes.filter((note) => {
      const titleMatch = note.title.toLowerCase().includes(searchTerm.toLowerCase());
      const contentMatch = note.content?.toLowerCase().includes(searchTerm.toLowerCase());
      return titleMatch || contentMatch;
    });

    setSearchResults(results);
  };

  const handleSelectNote = (noteId: string) => {
    setActiveNoteId(noteId);
    setOpen(false);
    toast.success("Note opened");
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search all notes..."
        onValueChange={handleSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Notes">
          {searchResults.map((note) => (
            <CommandItem
              key={note.id}
              onSelect={() => handleSelectNote(note.id)}
              className="flex flex-col items-start gap-1"
            >
              <div className="font-medium">{note.title}</div>
              {note.content && (
                <div className="text-sm text-muted-foreground line-clamp-1">
                  {note.content.replace(/<[^>]*>/g, '')}
                </div>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
