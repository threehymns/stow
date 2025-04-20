import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, LetterText, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useSettingsStore,
} from "@/store/settingsStore";
import { getGroupedSettings, type GroupedSettings } from "@/store/settingsConfig";
import type { SettingType } from "@/types/settings";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sun, Moon, Monitor } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getThemeById } from "@/lib/themes";
import ThemePreviewCircle from "@/components/ThemePreviewCircle.tsx";
import React, { createElement, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Edit2, Check, X } from "lucide-react";
import { Keybinding } from "@/components/ui/Keybinding";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

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

              <Card>
                <CardContent className="pt-6 space-y-6">
                  {/* Regular settings in this category */}
                  {categoryId === "appearance" && (
                    <div className="space-y-4">
                      <Label className="text-base font-medium flex items-center"><LetterText className="h-5 w-5 mr-2" /> Font Settings</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {["uiFont", "editorFont"].map((field) => {
                          const setting = category.settings.find((s) => s.id === field)!;
                          return (
                            <div key={setting.id} className="space-y-2">
                              <Label htmlFor={setting.id} className="text-base font-medium">
                                {setting.name}
                              </Label>
                              <Select
                                value={getSetting(setting.id) as string}
                                onValueChange={(value) => setSetting(setting.id, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select font" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(setting.options as { value: string; label?: string }[]).map(
                                    (opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label ?? opt.value}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 p-4 border rounded space-y-2">
                        <p style={{ fontFamily: "var(--font-ui)" }}>
                          UI Preview: The quick brown fox jumps over the lazy dog.
                        </p>
                        <p style={{ fontFamily: "var(--font-editor)" }}>
                          Editor Preview: The quick brown fox jumps over the lazy dog.
                        </p>
                      </div>
                    </div>
                  )}
                  {category.settings
                    .filter((s) => s.id !== "uiFont" && s.id !== "editorFont")
                    .map((setting) => (
                      <div key={setting.id} className="space-y-4">
                        {renderSetting(setting, getSetting, setSetting)}
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KeybindingField({ action, bindings: rawBindings, defaultBindings, setSetting, }: { action: { id: string; name: string }; bindings: unknown; defaultBindings: Record<string, string[]>; setSetting: (id: string, value: any) => void; }) {
  // Each action's value is now a string[]
  const bindings = (typeof rawBindings === 'object' && rawBindings) ? (rawBindings as Record<string, string[]>) : defaultBindings;
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [combo, setCombo] = useState("");
  const keybinds: string[] = Array.isArray(bindings[action.id]) ? bindings[action.id] : defaultBindings[action.id] || [];

  useEffect(() => { if (editingIdx === null) setCombo(""); }, [bindings, editingIdx]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const parts: string[] = [];
    if (e.ctrlKey) parts.push("Ctrl");
    if (e.shiftKey) parts.push("Shift");
    if (e.altKey) parts.push("Alt");
    if (e.metaKey) parts.push("Meta");
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) parts.push(key);
    setCombo(parts.join("+"));
  };

  const save = (idx: number | null) => {
    let newKeybinds = [...keybinds];
    if (combo && !newKeybinds.includes(combo)) {
      if (idx === null) {
        newKeybinds.push(combo);
      } else {
        newKeybinds[idx] = combo;
      }
      setSetting("keybindings", { ...bindings, [action.id]: newKeybinds });
    }
    setEditingIdx(null);
    setCombo("");
  };

  const remove = (idx: number) => {
    const newKeybinds = keybinds.filter((_, i) => i !== idx);
    setSetting("keybindings", { ...bindings, [action.id]: newKeybinds });
  };

  const reset = () => {
    setSetting("keybindings", { ...bindings, [action.id]: defaultBindings[action.id] });
    setEditingIdx(null);
    setCombo("");
  };

  return (
    <div className="flex items-center gap-4 p-3 border-b border-muted group hover:bg-muted/20 transition-colors">
      <Label className="text-base font-medium min-w-[120px] mr-2">{action.name}</Label>
      <div className="flex-1 flex items-center flex-wrap gap-2">
        {keybinds.map((bind, idx) => (
          <span key={bind + idx} className="flex items-center gap-1 relative group/keybind">
            {editingIdx === idx ? (
              <Input
                value={combo}
                placeholder="Press keys"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (editingIdx === -1) save(null);
                    else save(editingIdx);
                  } else {
                    handleKeyDown(e);
                  }
                }}
                autoFocus
                className="w-28 h-7 px-2 text-xs"
                onChange={() => { }}
                onBlur={() => {
                  if (editingIdx === -1) save(null);
                  else save(editingIdx);
                }}
              />
            ) : (
              <>
                <span
                  className="flex items-center cursor-pointer hover:bg-muted/40 rounded transition-colors p-1"
                  tabIndex={0}
                  role="button"
                  aria-label={`Edit keybind ${bind}`}
                  onClick={() => { setEditingIdx(idx); setCombo(bind); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setEditingIdx(idx); setCombo(bind);
                    }
                  }}
                >
                  <Keybinding combo={bind} />
                  <button
                    className="ml-1 opacity-0 group-hover/keybind:opacity-100 focus:opacity-100 w-0 group-hover/keybind:w-3 overflow-hidden transition-all"
                    tabIndex={0}
                    onClick={() => remove(idx)}
                    aria-label="Remove keybind"
                    style={{ background: 'none', border: 'none', padding: 0 }}
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </span>
              </>
            )}
          </span>
        ))}
        {/* Add new keybind */}
        {editingIdx === -1 ? (
          <Input
            value={combo}
            placeholder="Press keys"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (editingIdx === -1) save(null);
                else save(editingIdx);
              } else {
                handleKeyDown(e);
              }
            }}
            autoFocus
            className="w-28 h-7 px-2 text-xs"
            onChange={() => { }}
            onBlur={() => {
              if (editingIdx === -1) save(null);
              else save(editingIdx);
            }}
          />
        ) : (
          <Button
            variant="ghost"
            className="p-0 w-7 h-7 aspect-square border border-dashed border-muted text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground focus:opacity-100 transition-opacity"
            onClick={() => { setEditingIdx(-1); setCombo(""); }}
            tabIndex={0}
            aria-label="Add keybind"
          >
            <Plus className="w-2 h-2" />
          </Button>
        )}
      </div>
      <button
        className="ml-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        onClick={reset}
        title="Reset"
        tabIndex={0}
        style={{ background: 'none', border: 'none', padding: 0 }}
      >
        <ReloadIcon className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}

function renderSetting(
  setting: SettingType,
  getSetting: (id: string) => string | boolean | number,
  setSetting: (id: string, value: string | boolean | number) => void,
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
            onValueChange={(value: string) => {
              if (value !== undefined) {
                setSetting(setting.id, value);
              }
            }}
            className="justify-start flex-wrap"
          >
            {(setting.options as { value: string; icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>; label?: string }[]).map((option) => {
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
            onCheckedChange={(checked: boolean) => {
              setSetting(setting.id, checked);
            }}
          />
        </div>
      )}

      {setting.type === "keybindings" && (
        <div className="space-y-1">
          {setting.actions.map((action) => (
            <KeybindingField
              key={action.id}
              action={action}
              bindings={getSetting('keybindings')}
              defaultBindings={setting.initialValue as Record<string, string[]>}
              setSetting={setSetting}
            />
          ))}
        </div>
      )}
    </>
  );
}
