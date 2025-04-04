import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useSettingsStore,
} from "@/store/settingsStore";
import { getGroupedSettings, type GroupedSettings } from "@/store/settingsConfig";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sun, Moon, Monitor } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getThemeById } from "@/lib/themes";
import ThemePreviewCircle from "@/components/ThemePreviewCircle.tsx";
import { createElement } from "react";

export default function Settings() {
  const { setSetting, getSetting, settingsCategories } = useSettingsStore();

  const groupedSettings: GroupedSettings = getGroupedSettings();

  return (
    <div className="h-screen flex flex-col p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Table of Contents */}
        <div className="md:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Contents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(groupedSettings).map(([categoryId, category]) => (
                <div key={categoryId} className="space-y-2">
                  <a
                    href={`#${categoryId}`}
                    className="flex items-center text-sm font-medium hover:underline"
                  >
                    {category._category?.icon &&
                      createElement(category._category.icon, {
                        className: "h-4 w-4 mr-2",
                      })}
                    {category._category?.name || categoryId}
                  </a>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-3 space-y-8">
          {Object.entries(groupedSettings).map(([categoryId, category]) => (
            <div key={categoryId} id={categoryId} className="space-y-4">
              <div className="flex items-center space-x-2">
                {category._category?.icon &&
                  createElement(category._category.icon, {
                    className: "h-5 w-5",
                  })}
                <h2 className="text-xl font-semibold">
                  {category._category?.name || categoryId}
                </h2>
              </div>

              {category._category?.description && (
                <p className="text-muted-foreground">
                  {category._category.description}
                </p>
              )}

              <Separator />

              {/* Regular settings in this category */}
              {category.settings && category.settings.length > 0 && (
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    {category.settings.map((setting) => (
                      <div key={setting.id} className="space-y-4">
                        {renderSetting(setting, getSetting, setSetting)}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Subcategories */}
              {Object.entries(category._subcategories).length > 0 && (
                <div className="space-y-4">
                  <Tabs defaultValue={Object.keys(category._subcategories)[0]}>
                    <TabsList>
                      {Object.keys(category._subcategories).map(
                        (subcategory) => (
                          <TabsTrigger key={subcategory} value={subcategory}>
                            {subcategory}
                          </TabsTrigger>
                        ),
                      )}
                    </TabsList>

                    {Object.entries(category._subcategories).map(
                      ([subcategory, subcategorySettings]) => (
                        <TabsContent key={subcategory} value={subcategory}>
                          <Card>
                            <CardContent className="pt-6 space-y-6">
                              {(subcategorySettings as any[]).map((setting) => (
                                <div key={setting.id} className="space-y-4">
                                  {renderSetting(
                                    setting,
                                    getSetting,
                                    setSetting,
                                  )}
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        </TabsContent>
                      ),
                    )}
                  </Tabs>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderSetting(
  setting: any,
  getSetting: (id: string) => any,
  setSetting: (id: string, value: any) => void,
) {
  return (
    <>
      {setting.type === "select" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label
                htmlFor={setting.id}
                className="text-base font-medium flex items-center"
              >
                {setting.icon &&
                  createElement(setting.icon, { className: "h-4 w-4 mr-2" })}
                {setting.name}
              </Label>
              {setting.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {setting.description}
                </p>
              )}
            </div>
          </div>
          <ToggleGroup
            type="single"
            value={getSetting(setting.id).toString()}
            onValueChange={(value) => value && setSetting(setting.id, value)}
            className="justify-start"
          >
            {setting.options.map((optionRaw) => {
              const option = typeof optionRaw === "string" ? { value: optionRaw } : optionRaw;

              let icon: React.ReactNode | null = null;
              let displayName: string = option.value;

              if (option.icon) {
                icon = createElement(option.icon, { className: "h-5 w-5 mr-2" });
              } else if (setting.id === "colorTheme") {
                // Use a colored circle to represent the theme
                icon = <ThemePreviewCircle theme={getThemeById(option.value)} />;
              }

              if (setting.id === "colorTheme") {
                const themeObj = getThemeById(option.value);
                displayName = themeObj.name;
              } else if (option.label) {
                displayName = option.label;
              } else {
                displayName = option.value.charAt(0).toUpperCase() + option.value.slice(1);
              }

              return (
                <ToggleGroupItem
                  key={option.value}
                  value={option.value}
                  aria-label={`${displayName} option`}
                  className="flex items-center"
                >
                  {icon}
                  {displayName}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>
      )}

      {setting.type === "toggle" && (
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label
              htmlFor={`toggle-${setting.id}`}
              className="text-base font-medium flex items-center"
            >
              {setting.icon &&
                createElement(setting.icon, { className: "h-4 w-4 mr-2" })}
              {setting.name}
            </Label>
            {setting.description && (
              <p className="text-sm text-muted-foreground">
                {setting.description}
              </p>
            )}
          </div>
          <Switch
            id={`toggle-${setting.id}`}
            checked={getSetting(setting.id) as boolean}
            onCheckedChange={(checked) => setSetting(setting.id, checked)}
          />
        </div>
      )}
    </>
  );
}
