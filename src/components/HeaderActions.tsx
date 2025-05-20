
import React from "react";
import useNoteStore, { selectFolders, selectNotes } from "@/store/noteStore";
import { FolderPlus, Plus, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { SidebarIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { getCurrentTimestamp, createNote as createNoteService, createFolder as createFolderService, syncNotesAndFolders } from "@/services/noteService";
import { Note, Folder } from "@/types/notes";

const HeaderActions = React.memo(() => {
  const folders = useNoteStore(selectFolders);
  const notes = useNoteStore(selectNotes);
  const isLoading = useNoteStore(state => state.isLoading);
  const createNote = useNoteStore(state => state.createNote);
  const createFolder = useNoteStore(state => state.createFolder);
  const { user } = useAuth();
  const sidebar = useSidebar();

  const MotionButton = React.useMemo(() => motion.create(Button), []);

  const list = React.useMemo(
    () => ({
      visible: {
        opacity: 1,
        width: "auto",
        transition: {
          when: "beforeChildren",
          staggerChildren: 0.05,
          duration: 0.3,
          ease: "easeOut",
        },
      },
      hidden: {
        opacity: 0,
        width: 0,
        transition: {
          when: "afterChildren",
          staggerChildren: 0.05,
          duration: 0.2,
          ease: "easeIn",
        },
      },
    }),
    [],
  );

  const item = React.useMemo(
    () => ({
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.1,
          ease: "easeOut",
        },
      },
      hidden: {
        opacity: 0,
        x: -20,
        transition: {
          duration: 0.2,
          ease: "easeIn",
        },
      },
    }),
    [],
  );

  const handleCreateFolder = React.useCallback(async () => {
    if (!user?.id) return;
    await createFolder("New Folder", user.id);
  }, [folders.length, createFolder, user?.id]);

  const handleCreateNote = React.useCallback(async () => {
    if (!user?.id) return;
    await createNote(null, user.id);
  }, [createNote, user?.id]);


  const handleSync = async () => {
    if (!user?.id) return;

    try {
      useNoteStore.setState({ isLoading: true });
      const { notes: syncedNotes, folders: syncedFolders } = await syncNotesAndFolders(
        user.id,
        notes,
        folders,
      );
      useNoteStore.setState({
        notes: syncedNotes,
        folders: syncedFolders,
        activeNoteId: syncedNotes.length > 0 ? syncedNotes[0].id : null,
        isSynced: true,
      });
      toast.success("Notes synchronized");
    } catch (error: unknown) {
      console.error("Failed to sync notes:", error instanceof Error ? error.message : error);
      toast.error("Failed to sync notes");
    } finally {
      useNoteStore.setState({ isLoading: false });
    }
  };

  return (
    <div
      className={cn(
        "fixed top-2 z-[1000] left-2 bg-sidebar p-1 rounded-lg flex space-x-1 transition-colors duration-500",
        sidebar.open && "bg-transparent",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        title="Toggle Sidebar"
        onClick={() => sidebar.toggleSidebar()}
      >
        <SidebarIcon />
      </Button>
      <AnimatePresence>
        {!sidebar.open && (
          <motion.div
            className="flex space-x-1 -z-10"
            initial="hidden"
            animate={sidebar.open ? "hidden" : "visible"}
            exit="hidden"
            variants={list}
          >
            {user && (
              <>
                <MotionButton
                  onClick={handleSync}
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  title="Sync Notes"
                  disabled={isLoading}
                  variants={item}
                >
                  <RefreshCw className={cn(isLoading && "animate-spin")} />
                </MotionButton>
              </>
            )}
            <MotionButton
              onClick={handleCreateFolder}
              variant="ghost"
              size="icon"
              className="size-7"
              title="New Folder"
              variants={item}
            >
              <FolderPlus />
            </MotionButton>
            <MotionButton
              onClick={handleCreateNote}
              variant="ghost"
              size="icon"
              className="size-7"
              title="New Note"
              variants={item}
            >
              <Plus />
            </MotionButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default HeaderActions;
