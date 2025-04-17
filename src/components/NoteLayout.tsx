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
import { useEffect, useState, useRef } from "react";
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
    lastSyncTimestamp,
    syncAll,
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
          await syncAll(user.id);
          if (isActive && !realtimeEnabled && user.id) {
            enableRealtime(user.id);
            toast.success("Real-time sync enabled");
          }
        } catch (error) {
          console.error("Error syncing with Supabase:", error);
          toast.error("Failed to sync with Supabase");
        } finally {
          if (isActive) setIsSyncing(false);
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
  }, [user, loading, isSynced, enableRealtime, realtimeEnabled, isSyncing]);

  // Re-establish realtime connection if it was disabled
  useEffect(() => {
    if (user && isSynced && !realtimeEnabled) {
      console.log("Real-time sync was disabled, re-enabling...");
      if (user?.id) enableRealtime(user.id);
    }
  }, [user, isSynced, realtimeEnabled, enableRealtime]);

  // Reset store and disable realtime only on sign-out (not initial load)
  const prevUserRef = useRef(user);
  useEffect(() => {
    if (prevUserRef.current && !user) {
      console.log("User signed out, resetting store");
      resetStore();
      if (realtimeEnabled) disableRealtime();
    }
    prevUserRef.current = user;
  }, [user, resetStore, disableRealtime, realtimeEnabled]);

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
