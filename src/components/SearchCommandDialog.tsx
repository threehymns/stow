import { useCallback, useEffect, useState } from "react";
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
import { FileText } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");

  // Register with command center
  const handleOpenDialog = useCallback(() => {
    setOpen(true);
    handleSearch("");
  }, []);
  useEffect(() => {
    commandCenter.on("searchNotes", handleOpenDialog);
    return () => {
      commandCenter.off("searchNotes", handleOpenDialog);
    };
  }, [handleOpenDialog]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term) {
      setSearchResults([]);
      return;
    }

    const results = notes.filter((note) => {
      const titleMatch = note.title.toLowerCase().includes(term.toLowerCase());
      const contentMatch = note.content?.toLowerCase().includes(term.toLowerCase());
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
        {searchResults.length === 0 ? (
          searchTerm !== "" && <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          <CommandGroup heading="Notes" forceMount>
            {searchResults.map((note) => (
              <CommandItem
                key={note.id}
                onSelect={() => handleSelectNote(note.id)}
              >
                <FileText className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <div className="font-medium">{note.title}</div>
                  {note.content && (
                    <div className="text-[0.75rem] text-muted-foreground line-clamp-1">
                      {note.content.split(/<br\s*\/?>|<\/?li>|<\/?p>/gi)
                        .filter(line =>
                          line.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .join('\n')
                        .replace(/<[^>]*>/g, '')}
                    </div>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
