
import { NoteSidebar } from './NoteSidebar';
import { MarkdownEditor } from './MarkdownEditor';
import { useEffect } from 'react';
import useNoteStore from '@/store/noteStore';

export function NoteLayout() {
  const { notes, createNote } = useNoteStore();

  // Create initial note if none exist
  useEffect(() => {
    if (notes.length === 0) {
      createNote();
    }
  }, [notes.length, createNote]);

  return (
    <div className="flex h-screen overflow-hidden">
      <NoteSidebar />
      <MarkdownEditor />
    </div>
  );
}
