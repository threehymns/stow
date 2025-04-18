import { NoteLayout } from "@/components/NoteLayout";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Command } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Keybinding } from "@/components/ui/Keybinding";
import commandCenter from "@/hooks/commandCenter";

const Index = () => {
  // Change document title
  useEffect(() => {
    document.title = "Slate - Notes App";
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      <NoteLayout />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-4 right-4 z-50"
            onClick={() => commandCenter.emit("commandBar")}
          >
            <Command className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="flex items-center gap-2">
          Command Bar <Keybinding command="commandBar" />
        </TooltipContent>
      </Tooltip>
    </motion.div>
  );
};

export default Index;
