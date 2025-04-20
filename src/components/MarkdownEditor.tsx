import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useEditor, EditorContent, createDocument } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import CodeBlock from "@tiptap/extension-code-block";
import Code from "@tiptap/extension-code";
import Blockquote from "@tiptap/extension-blockquote";
import Typography from "@tiptap/extension-typography";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import History from "@tiptap/extension-history";
import { EditorToolbar } from "./EditorToolbar";
import useNoteStore from "@/store/noteStore";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { debounce } from "@/lib/utils";

export function MarkdownEditor() {
  const {
    notes,
    activeNoteId,
    updateNote,
    setActiveNoteId,
    realtimeEnabled
  } = useNoteStore();

  const { user } = useAuth();

  const activeNote = notes.find((note) => note.id === activeNoteId);

  const [title, setTitle] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isLocalUpdate = useRef(false);

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setIsInitialized(true);
    } else {
      setActiveNoteId(null);
    }
  }, [activeNoteId]);

  // Debounced save via store.updateNote, userId passed in
  const debouncedSaveNote = useRef(
    debounce(async (noteId: string, data: Partial<typeof activeNote>, userId: string) => {
      setIsSaving(true);
      isLocalUpdate.current = true;
      try {
        await updateNote(noteId, data, userId);
        console.log("Note saved via store.updateNote:", data);
      } catch (error) {
        console.error("Failed to save note via store:", error);
      } finally {
        setIsSaving(false);
        isLocalUpdate.current = false;
      }
    }, 500)
  ).current;

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      History,
      Bold,
      Italic,
      Underline,
      Strike,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList,
      OrderedList,
      ListItem,
      CodeBlock,
      Code,
      Blockquote,
      Link.configure({
        openOnClick: false,
      }),
      Typography,
      Placeholder.configure({
        placeholder: "Begin writing your thoughts...",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "focus:outline-none prose prose-slate prose-headings:font-semibold prose-p:my-3 prose-p:leading-relaxed editor-content",
        spellcheck: "false",
      },
    },
    content: activeNote?.content || "",
    onUpdate: ({ editor }) => {
      if (activeNoteId && isInitialized && user?.id) {
        const content = editor.getHTML();
        debouncedSaveNote(activeNoteId, { content }, user.id);
      }
    },
  });

  // Sync title when activeNote.title changes remotely
  useEffect(() => {
    if (isInitialized && activeNote && !isLocalUpdate.current) {
      setTitle(activeNote.title);
    }
  }, [activeNote?.title, realtimeEnabled]);

  // Update editor content when activeNote changes or is updated by another client
  useEffect(() => {
    if (editor && activeNote && !isLocalUpdate.current && !editor.isFocused) {
      const currentContent = editor.getHTML();
      
      // Only update if the content actually changed and it's not from a local edit
      if (activeNote.content !== currentContent) {
        console.log("Updating editor with new content from remote");
        editor.commands.setContent(activeNote.content || "");
      }
    }
  }, [editor, activeNote?.content, realtimeEnabled]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (activeNoteId && isInitialized) {
      if (user?.id) debouncedSaveNote(activeNoteId, { title: newTitle }, user.id);
    }
  };

  if (!activeNoteId) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md mx-auto">
          <h3 className="text-2xl font-medium mb-2">No note selected</h3>
          <p className="text-muted-foreground">
            Create a new note or select an existing one from the sidebar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeNoteId}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col"
        >
          <div
            className="px-6 py-2 w-full bg-background/75 backdrop-blur-md left-0 z-10 absolute"
            style={{ clipPath: "inset(0 8px 0 0)" }}
          >
            <EditorToolbar
              editor={editor}
              className="max-w-prose w-fit mx-auto"
            />
          </div>

          <div className="flex-1 px-6 pt-20 w-full max-w-prose mx-auto font-editor">
            <Input
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Note"
              className="border-0 bg-transparent p-0 mb-2 md:text-2xl font-black focus-visible:ring-0 focus-visible:ring-secondary leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  editor?.commands.focus("start");
                  editor?.commands.enter();
                  editor?.commands.focus("start");
                }
              }}
            />
            <EditorContent editor={editor} />
            <div
              className="min-h-[calc(100vh-15em)]"
              onClick={() => editor?.commands.focus("end")}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
