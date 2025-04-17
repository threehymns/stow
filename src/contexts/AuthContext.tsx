import { createContext, useContext, useEffect, useState } from "react";
import useNoteStore from "@/store/noteStore";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Show toast on signin/signout
      if (event === "SIGNED_IN") {
        toast.success("Signed in successfully");
        try {
          if (session?.user) {

            // Enable realtime
            useNoteStore.getState().enableRealtime(session.user.id);
            console.log("Realtime sync enabled after sign in");

            useNoteStore.getState().syncAll(session.user.id);
          }
        } catch (error) {
          console.error("Failed to enable realtime sync after sign in:", error);
        }
      } else if (event === "SIGNED_OUT") {
        toast.success("Signed out successfully");
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          if (session?.user) {
            useNoteStore.getState().enableRealtime(session.user.id);
            console.log("Realtime sync enabled on initial load");
          }
        } catch (error) {
          console.error("Failed to enable realtime sync on initial load:", error);
        }
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Flush offline queue on network reconnect
  useEffect(() => {
    if (!user) return;
    const handleOnline = () => {
      console.log('Network reconnected, flushing offline queue');
      useNoteStore.getState().flushQueue(user.id);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  const signIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: import.meta.env.VITE_PUBLIC_URL || window.location.origin,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error("Error signing in:", error);
      toast.error("Failed to sign in");
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
