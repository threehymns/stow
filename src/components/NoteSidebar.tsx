
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import useNoteStore from '@/store/noteStore';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Plus, 
  Search, 
  Trash2 
} from 'lucide-react';
import { format } from 'date-fns';

export function NoteSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { notes, activeNoteId, setActiveNoteId, createNote, deleteNote } = useNoteStore();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      className={cn(
        "h-screen flex flex-col bg-sidebar border-r border-sidebar-border shadow-sm relative transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-sidebar-foreground animate-slide-in">
            Notes
          </h2>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="ml-auto"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      <div className={cn("p-4", isCollapsed && "hidden")}>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 py-2 bg-sidebar-accent text-sidebar-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
          />
        </div>
      </div>

      <Separator className="my-1" />

      <ScrollArea className="flex-1">
        {filteredNotes.length > 0 ? (
          <div className="p-2">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => setActiveNoteId(note.id)}
                className={cn(
                  "w-full text-left transition-colors rounded-md note-transition hover:bg-sidebar-accent group relative",
                  activeNoteId === note.id ? "bg-sidebar-accent" : "",
                  isCollapsed ? "p-2 flex justify-center" : "p-3"
                )}
              >
                <div className="flex items-start">
                  <FileText size={isCollapsed ? 18 : 16} className="mr-2 mt-0.5 text-sidebar-foreground" />
                  {!isCollapsed && (
                    <div className="flex-1 overflow-hidden">
                      <h3 className="text-sm font-medium truncate text-sidebar-foreground">
                        {note.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {format(new Date(note.updatedAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  )}
                </div>
                
                {!isCollapsed && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                  >
                    <Trash2 size={14} className="text-muted-foreground hover:text-destructive" />
                  </Button>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className={cn(
            "flex flex-col items-center justify-center h-40 px-4",
            isCollapsed && "hidden"
          )}>
            <p className="text-sm text-muted-foreground text-center">
              {searchTerm ? "No notes match your search" : "No notes yet"}
            </p>
          </div>
        )}
      </ScrollArea>

      <div className="p-4">
        <Button
          onClick={createNote}
          className={cn(
            "transition-all duration-300",
            isCollapsed ? "w-full p-2 justify-center" : "w-full"
          )}
        >
          <Plus size={16} className={cn("flex-shrink-0", !isCollapsed && "mr-2")} />
          {!isCollapsed && <span>New Note</span>}
        </Button>
      </div>
    </div>
  );
}
