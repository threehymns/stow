
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
import { syncNotesAndFolders } from "@/services/noteService";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import useNoteStore from "@/store/noteStore";
import { AuthStatus } from "./auth/AuthStatus";
import { toast } from "sonner";

export function NoteLayout() {
  const { user, loading } = useAuth();
  const { 
    notes, 
    folders, 
    resetStore, 
    isSynced, 
    activeNoteId, 
    enableRealtime, 
    disableRealtime,
    realtimeEnabled
  } = useNoteStore();

  // Sync notes with Supabase when user signs in
  useEffect(() => {
    const syncData = async () => {
      if (user && !loading && !isSynced) {
        console.log("Syncing with Supabase for user:", user.id);
        try {
          // Sync with Supabase when user is authenticated
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
          
          // Enable real-time sync after initial data sync
          if (!realtimeEnabled) {
            enableRealtime();
            toast.success("Real-time sync enabled");
          }
        } catch (error) {
          console.error("Error syncing with Supabase:", error);
          toast.error("Failed to sync with Supabase");
        }
      } else if (!user && !loading) {
        console.log("User not authenticated, resetting store");
        // Reset store when user signs out
        resetStore();
        
        // Disable real-time sync when user signs out
        if (realtimeEnabled) {
          disableRealtime();
        }
      }
    };

    syncData();
    
    // Cleanup real-time subscription when component unmounts
    return () => {
      if (realtimeEnabled) {
        disableRealtime();
      }
    };
  }, [user, loading, resetStore, isSynced, enableRealtime, disableRealtime, realtimeEnabled, notes, folders]);

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
          <MarkdownEditor key={activeNoteId} />
        </div>
      </SidebarProvider>
    </div>
  );
}
