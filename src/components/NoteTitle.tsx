import React, { useCallback } from "react";
import useNoteStore from "@/store/noteStore";

interface NoteTitleProps {
  noteId: string;
  userId: string;
}

const NoteTitle = React.memo(function NoteTitle({ noteId, userId }: NoteTitleProps) {
  const note = useNoteStore(
    state => state.notes.find(note => note.id === noteId)
  );
  const updateNote = useNoteStore(state => state.updateNote);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!note) return;
      updateNote(noteId, { title: e.target.value }, userId);
    },
    [noteId, note, updateNote, userId]
  );

  return (
    <input
      className="note-title-input"
      value={note?.title || ''}
      onChange={handleTitleChange}
      placeholder="Untitled Note"
      style={{ fontWeight: 600, fontSize: 20, width: '100%' }}
    />
  );
});

export default NoteTitle;
