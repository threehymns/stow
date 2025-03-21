import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useEditor, EditorContent } from "@tiptap/react";
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
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "./EditorToolbar";
import useNoteStore from "@/store/noteStore";
import { AnimatePresence, motion } from "framer-motion";

export function MarkdownEditor() {
  const { notes, activeNoteId, updateNote } = useNoteStore();
  const activeNote = notes.find((note) => note.id === activeNoteId);

  const [title, setTitle] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setIsInitialized(true);
    } else {
      setTitle("");
    }
  }, [activeNote]);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
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
    onUpdate: ({ editor }) => {
      if (activeNoteId && isInitialized) {
        updateNote(activeNoteId, { content: editor.getHTML() });
      }
    },
  });

  // Update editor content when active note changes
  useEffect(() => {
    if (editor && activeNote && isInitialized) {
      if (editor.getHTML() !== activeNote.content) {
        editor.commands.setContent(activeNote.content);
      }
    }
  }, [editor, activeNote, isInitialized]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (activeNoteId && isInitialized) {
      updateNote(activeNoteId, { title: newTitle });
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
          className="flex-1 flex flex-col overflow-auto"
        >
          <div className="px-6 pt-6 pb-3">
            <Input
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled Note"
              className="border-0 px-0 text-2xl font-semibold focus-visible:ring-0 leading-relaxed"
            />
          </div>

          <div className="px-6 pb-2">
            <EditorToolbar editor={editor} />
          </div>

          <div className="flex-1 px-6 py-4 overflow-auto">
            <EditorContent editor={editor} className="min-h-full" />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
