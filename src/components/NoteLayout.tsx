
import { NoteSidebar } from './NoteSidebar';
import { MarkdownEditor } from './MarkdownEditor';
import { useEffect } from 'react';
import useNoteStore from '@/store/noteStore';

export function NoteLayout() {
  const { notes, folders, createNote, createFolder } = useNoteStore();

  // Create initial data if none exist
  useEffect(() => {
    // Create root folder if it doesn't exist
    if (folders.length === 0) {
      createFolder('All Notes', null);
    }
    
    // Create initial note if none exist
    if (notes.length === 0) {
      createNote();
    }
  }, [notes.length, folders.length, createNote, createFolder]);

  return (
    <div className="flex h-screen overflow-hidden">
      <NoteSidebar />
      <MarkdownEditor />
    </div>
  );
}
