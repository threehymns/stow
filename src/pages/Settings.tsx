
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Moon, Sun, Monitor } from "lucide-react";
import { Link } from "react-router-dom";
import useSettingsStore from "@/store/settingsStore";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function Settings() {
  const { theme, showNoteDates, setTheme, setShowNoteDates } = useSettingsStore();

  return (
    <div className="h-screen flex flex-col p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how the application looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Theme</Label>
              <ToggleGroup type="single" value={theme} onValueChange={(value) => value && setTheme(value as 'light' | 'dark' | 'system')}>
                <ToggleGroupItem value="light" aria-label="Light theme">
                  <Sun className="h-5 w-5 mr-2" />
                  Light
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" aria-label="Dark theme">
                  <Moon className="h-5 w-5 mr-2" />
                  Dark
                </ToggleGroupItem>
                <ToggleGroupItem value="system" aria-label="System theme">
                  <Monitor className="h-5 w-5 mr-2" />
                  System
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interface</CardTitle>
            <CardDescription>
              Control how notes and folders are displayed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-dates">Show note dates</Label>
                <p className="text-sm text-muted-foreground">
                  Display modification dates under note titles in the sidebar
                </p>
              </div>
              <Switch
                id="show-dates"
                checked={showNoteDates}
                onCheckedChange={setShowNoteDates}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
