
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { Note, Folder } from "@/types/notes";
import { EditableItem } from "./EditableItem";
import { NoteContextMenu } from "./NoteContextMenu";

interface NoteItemProps {
  note: Note;
  activeNoteId: string | null;
  editingItemId: string | null;
  editingName: string;
  showNoteDates: boolean;
  folders: Folder[];
  setActiveNoteId: (id: string | null) => void;
  setEditingItemId: (id: string | null) => void;
  setEditingName: (name: string) => void;
  handleRenameSubmit: (e: React.FormEvent) => void;
  moveNote: (noteId: string, folderId: string | null) => void;
  deleteNote: (id: string) => void;
}

export function NoteItem({
  note,
  activeNoteId,
  editingItemId,
  editingName,
  showNoteDates,
  folders,
  setActiveNoteId,
  setEditingItemId,
  setEditingName,
  handleRenameSubmit,
  moveNote,
  deleteNote,
}: NoteItemProps) {
  return (
    <div
      key={note.id}
      onMouseDown={() => setActiveNoteId(note.id)}
      onClick={() => setActiveNoteId(note.id)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditingItemId(note.id);
        setEditingName(note.title);
      }}
      className={cn(
        "flex items-start rounded-md pl-2 pr-1 py-2 relative group/item hover:bg-sidebar-accent",
        activeNoteId === note.id ? "bg-sidebar-accent" : "",
      )}
    >
      <FileText
        size={14}
        className="mr-2 mt-0.5 min-w-4 text-sidebar-foreground"
      />
      <div className="flex-1 w-2">
        {editingItemId === note.id ? (
          <EditableItem
            value={editingName}
            onChange={setEditingName}
            onSubmit={handleRenameSubmit}
          />
        ) : (
          <h3 className="text-xs font-medium truncate text-sidebar-foreground">
            {note.title}
          </h3>
        )}
        {showNoteDates && (
          <p className="text-[10px] text-muted-foreground truncate">
            {format(new Date(note.updatedAt), "MMM d, h:mm a")}
          </p>
        )}
      </div>
      <NoteContextMenu
        note={note}
        folders={folders}
        moveNote={moveNote}
        deleteNote={deleteNote}
      />
    </div>
  );
}
