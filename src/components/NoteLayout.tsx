
import { NoteSidebar } from "./NoteSidebar";
import { MarkdownEditor } from "./MarkdownEditor";
import { Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import HeaderActions from "./HeaderActions";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import useNoteStore from "@/store/noteStore";

export function NoteLayout() {
  const { user, loading } = useAuth();
  const { syncWithSupabase, resetStore, isSynced } = useNoteStore();

  // Sync notes with Supabase when user signs in
  useEffect(() => {
    if (user && !loading && !isSynced) {
      // Sync with Supabase when user is authenticated
      syncWithSupabase(user.id);
    } else if (!user && !loading) {
      // Reset store when user signs out
      resetStore();
    }
  }, [user, loading, syncWithSupabase, resetStore, isSynced]);

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarProvider>
        <HeaderActions />
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
      </SidebarProvider>
    </div>
  );
}
