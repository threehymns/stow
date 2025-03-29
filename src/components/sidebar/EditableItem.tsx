
import { useRef, useEffect } from "react";

interface EditableItemProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function EditableItem({
  value,
  onChange,
  onSubmit,
  onKeyDown,
}: EditableItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onSubmit(e);
        }
        onKeyDown?.(e);
      }}
      onBlur={onSubmit}
      className="text-xs bg-sidebar block focus:outline-none ring-1 ring-offset-1 ring-offset-sidebar-accent ring-sidebar-border font-bold rounded-sm w-full"
      autoFocus
    />
  );
}
