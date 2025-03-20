
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { Note } from '@/types/notes';

interface NoteState {
  notes: Note[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  createNote: () => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;
}

const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],
      activeNoteId: null,

      setActiveNoteId: (id) => {
        set({ activeNoteId: id });
      },

      createNote: () => {
        const now = new Date().toISOString();
        const newNote: Note = {
          id: nanoid(),
          title: 'Untitled Note',
          content: '',
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          notes: [newNote, ...state.notes],
          activeNoteId: newNote.id,
        }));
      },

      updateNote: (id, data) => {
        set((state) => ({
          notes: state.notes.map((note) => 
            note.id === id 
              ? { 
                  ...note, 
                  ...data, 
                  updatedAt: new Date().toISOString() 
                } 
              : note
          ),
        }));
      },

      deleteNote: (id) => {
        const { notes, activeNoteId } = get();
        const filteredNotes = notes.filter((note) => note.id !== id);
        
        set({
          notes: filteredNotes,
          activeNoteId: 
            activeNoteId === id 
              ? filteredNotes.length > 0 
                ? filteredNotes[0].id 
                : null 
              : activeNoteId,
        });
      },
    }),
    {
      name: 'notes-storage',
    }
  )
);

export default useNoteStore;
