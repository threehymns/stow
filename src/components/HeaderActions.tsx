import useNoteStore from "@/store/noteStore";
import { FolderPlus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { SidebarIcon } from "lucide-react";

const HeaderActions = () => {
  const { createFolder, createNote } = useNoteStore();
  const sidebar = useSidebar();
  const MotionButton = motion.create(Button);
  const list = {
    visible: { opacity: 1, width: "auto" },
    hidden: { opacity: 0, width: 0 },
  };

  const item = {
    visible: { opacity: 1, x: 0 },
    hidden: { opacity: 0, x: -50 },
  };

  return (
    <div
      className={cn(
        "fixed top-2 left-2 z-[10000] bg-sidebar p-1 rounded-lg flex space-x-1",
        sidebar.open && "bg-transparent"
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
      {!sidebar.open && (
        <motion.div
          className="flex space-x-1"
          initial="hidden"
          whileInView="visible"
          variants={list}
        >
          <MotionButton
            onClick={() => createFolder("New Folder")}
            variant="ghost"
            size="icon"
            className="size-7"
            title="New Folder"
            variants={item}
          >
            <FolderPlus />
          </MotionButton>
          <MotionButton
            onClick={() => createNote(null)}
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
    </div>
  );
};

export default HeaderActions;
