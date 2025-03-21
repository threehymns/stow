import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { settings, useSettingsStore } from "@/store/settingsStore";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sun, Moon, Monitor, Icon } from "lucide-react";

export default function Settings() {
  const { setSetting, getSetting, theme, showNoteDates } = useSettingsStore();

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
        {settings.map((setting) => (
          <Card key={setting.id}>
            <CardHeader>
              <CardTitle>{setting.name}</CardTitle>
              <CardDescription>
                {/* Add descriptions for each setting if needed */}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {setting.type === "select" && (
                <div className="space-y-2">
                  <Label>{setting.name}</Label>
                  <ToggleGroup
                    type="single"
                    value={getSetting(setting.id).toString()}
                    onValueChange={(value) =>
                      value && setSetting(setting.id, value)
                    }
                  >
                    {setting.options.map((option) => {
                      let icon: React.ReactNode;
                      if (setting.id === "theme") {
                        if (option === "light") {
                          icon = <Sun className="h-5 w-5 mr-2" />;
                        } else if (option === "dark") {
                          icon = <Moon className="h-5 w-5 mr-2" />;
                        } else {
                          icon = <Monitor className="h-5 w-5 mr-2" />;
                        }
                      }

                      return (
                        <ToggleGroupItem
                          key={option}
                          value={option}
                          aria-label={`${option} option`}
                        >
                          {icon}
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </ToggleGroupItem>
                      );
                    })}
                  </ToggleGroup>
                </div>
              )}
              {setting.type === "toggle" && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={`toggle-${setting.id}`}>
                      {setting.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {/* Add specific descriptions here */}
                    </p>
                  </div>
                  <Switch
                    id={`toggle-${setting.id}`}
                    checked={getSetting(setting.id) as boolean}
                    onCheckedChange={(checked) =>
                      setSetting(setting.id, checked)
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
