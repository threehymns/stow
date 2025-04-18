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

export function CommandRouter() {
  const navigate = useNavigate();
  useCommand("openSettings", () => navigate("/settings"));
  return null;
}

const queryClient = new QueryClient();

function SettingsSyncer() {
  useSettingsSync();
  return null;
}

const App = () => {
  // Register all global keybindings to emit events
  useGlobalKeybinds();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SettingsSyncer />
          <TooltipProvider>
            <Sonner richColors />
            <BrowserRouter>
              {/* Global keybinds handled via useGlobalKeybinds() */}
              <CommandRouter />
              <CommandBar />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/settings" element={<Settings />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
