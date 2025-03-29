import React from "react";
import useNoteStore from "@/store/noteStore";
import { FolderPlus, Plus, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { SidebarIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const HeaderActions = () => {
  const { createFolder, createNote, syncWithSupabase, isLoading } =
    useNoteStore();
  const { user } = useAuth();
  const sidebar = useSidebar();
  const MotionButton = React.useMemo(() => motion.create(Button), []);
  const list = React.useMemo(
    () => ({
      visible: {
        opacity: 1,
        width: "auto",
      },
      hidden: {
        opacity: 0,
        width: 0,
      },
    }),
    [],
  );
  const item = React.useMemo(
    () => ({
      visible: {
        opacity: 1,
        x: 0,
      },
      hidden: {
        opacity: 0,
        x: -50,
      },
    }),
    [],
  );
  const handleCreateFolder = () => {
    const newFolderId = createFolder("New Folder", null);
    console.log("Created new folder with ID:", newFolderId);
  };
  const handleCreateNote = () => {
    const newNoteId = createNote(null);
    console.log("Created new note with ID:", newNoteId);
  };
  const handleSync = async () => {
    if (user) {
      await syncWithSupabase(user.id);
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
            whileInView="visible"
            exit="hidden"
            variants={list}
          >
            {user && (
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
