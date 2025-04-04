
import React from "react";
import useNoteStore from "@/store/noteStore";
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

const HeaderActions = () => {
  const {
    notes,
    folders,
    createNoteLocal,
    createFolderLocal,
    isLoading,
  } = useNoteStore();

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

  const handleCreateFolder = async () => {
    const now = getCurrentTimestamp();
    const newFolder: Folder = {
      id: uuidv4(),
      name: `New Folder ${folders.length}`,
      createdAt: now,
      parentId: null,
    };

    try {
      if (user?.id) {
        await createFolderService(newFolder, user.id);
      }
      createFolderLocal(newFolder.name);
      toast.success("New folder created");
    } catch (error: any) {
      console.error("Failed to create folder:", error);
      toast.error("Failed to create folder");
    }
  };

  const handleCreateNote = async () => {
    const now = getCurrentTimestamp();
    const newNote: Note = {
      id: uuidv4(),
      title: "Untitled Note",
      content: "",
      createdAt: now,
      updatedAt: now,
      folderId: null,
    };

    try {
      if (user?.id) {
        await createNoteService(newNote, user.id);
      }
      createNoteLocal();
      toast.success("New note created");
    } catch (error: any) {
      console.error("Failed to create note:", error);
      toast.error("Failed to create note");
    }
  };

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
    } catch (error: any) {
      console.error("Failed to sync notes:", error);
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
};

export default HeaderActions;
