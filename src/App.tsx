import { Toaster as Sonner } from "@/components/ui/sonner";
import { useSettingsSync } from "./store/useSettingsSync";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import { ThemeProvider } from "./components/ThemeProvider";
import { CommandBar } from "./components/CommandBar";
import { AuthProvider } from "./contexts/AuthContext";
import { useGlobalKeybinds } from "@/hooks/useGlobalKeybinds";
import { useNavigate } from "react-router-dom";
import { useCommand } from "@/hooks/commandCenter";
import { KeyPressProvider } from "@/components/ui/KeyPressContext";
import { SearchCommandDialog } from "./components/SearchCommandDialog";

/**
 * Listens for the "openSettings" command and navigates to the settings page when triggered.
 *
 * @remark
 * This component does not render any UI and should be included within a router context.
 */
export function CommandRouter() {
  const navigate = useNavigate();
  useCommand("openSettings", () => navigate("/settings"));
  return null;
}

const queryClient = new QueryClient();

/**
 * Synchronizes application settings using the {@link useSettingsSync} hook.
 *
 * This component does not render any UI.
 */
function SettingsSyncer() {
  useSettingsSync();
  return null;
}

const App = () => {
  useGlobalKeybinds();
  return (
    <KeyPressProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SettingsSyncer />
            <TooltipProvider>
              <Sonner richColors />
              <BrowserRouter>
                <CommandRouter />
                <CommandBar />
                <SearchCommandDialog />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </KeyPressProvider>
  );
};

export default App;
