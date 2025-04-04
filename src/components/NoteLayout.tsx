
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
import { useEffect, useState } from "react";
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
    enableRealtime: _enableRealtime,
    disableRealtime,
    realtimeEnabled,
    lastSyncTimestamp
  } = useNoteStore();

  const enableRealtime = _enableRealtime as (userId: string) => void;

  const [isSyncing, setIsSyncing] = useState(false);

  // Sync notes with Supabase when user signs in
  useEffect(() => {
    let isActive = true; // for preventing state updates after unmount
    
    const syncData = async () => {
      if (user && !loading && !isSynced && !isSyncing) {
        console.log("Syncing with Supabase for user:", user.id);
        try {
          setIsSyncing(true);
          // Sync with Supabase when user is authenticated
          const { notes: syncedNotes, folders: syncedFolders } = await syncNotesAndFolders(
            user.id,
            [],
            [],
          );
          
          if (isActive) {
            const { lastRealtimeUpdate } = useNoteStore.getState();

            // Find latest updatedAt timestamp from synced notes and folders
            const latestSyncedTimestamp = [
              ...syncedNotes.map(n => n.updatedAt || n.createdAt),
              ...syncedFolders.map(f => f.createdAt)
            ].reduce((latest, ts) => {
              return new Date(ts).getTime() > new Date(latest).getTime() ? ts : latest;
            }, "1970-01-01T00:00:00.000Z");

            // Only update store if REST data is newer than last realtime update
            if (!lastRealtimeUpdate || new Date(latestSyncedTimestamp).getTime() > new Date(lastRealtimeUpdate).getTime()) {
              useNoteStore.setState({
                notes: syncedNotes,
                folders: syncedFolders,
                activeNoteId: syncedNotes.length > 0 ? syncedNotes[0].id : null,
                isSynced: true,
                lastSyncTimestamp: new Date().toISOString()
              });
            } else {
              console.log("Skipped updating store from REST sync because real-time data is newer");
            }
            
            // Enable real-time sync after initial data sync
            if (!realtimeEnabled && user?.id) {
              enableRealtime(user.id);
              toast.success("Real-time sync enabled");
            }
          }
        } catch (error) {
          console.error("Error syncing with Supabase:", error);
          toast.error("Failed to sync with Supabase");
        } finally {
          if (isActive) {
            setIsSyncing(false);
          }
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
    
    // Ensure real-time sync remains enabled if user is authenticated
    if (user && !loading && isSynced && !realtimeEnabled) {
      console.log("Re-enabling real-time sync");
      if (user?.id) enableRealtime(user.id);
    }
    
    // Cleanup real-time subscription when component unmounts
    return () => {
      isActive = false;
    };
  }, [user, loading, resetStore, isSynced, enableRealtime, disableRealtime, realtimeEnabled, isSyncing]);

  // Re-establish realtime connection if it was disabled
  useEffect(() => {
    if (user && isSynced && !realtimeEnabled) {
      console.log("Real-time sync was disabled, re-enabling...");
      if (user?.id) enableRealtime(user.id);
    }
  }, [user, isSynced, realtimeEnabled, enableRealtime]);

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
