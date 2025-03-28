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

const Index = () => {
  // Change document title
  useEffect(() => {
    document.title = "Stow - Notes App";
  }, []);

  const openCommandBar = (e: React.MouseEvent) => {
    e.preventDefault();
    // Simulate the Ctrl+K shortcut
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

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
            onClick={openCommandBar}
          >
            <Command className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Command Bar (Ctrl+K)</p>
        </TooltipContent>
      </Tooltip>
    </motion.div>
  );
};

export default Index;
