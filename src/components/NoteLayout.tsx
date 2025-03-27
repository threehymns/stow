import { NoteSidebar } from "./NoteSidebar";
import { MarkdownEditor } from "./MarkdownEditor";
import { useEffect } from "react";
import useNoteStore from "@/store/noteStore";
import { Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function NoteLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <NoteSidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-20"
              asChild
            >
              <Link to="/settings">
                <SettingsIcon className="h-5 w-5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
        <MarkdownEditor />
      </div>
    </div>
  );
}
