
import { NoteSidebar } from './NoteSidebar';
import { MarkdownEditor } from './MarkdownEditor';
import { useEffect } from 'react';
import useNoteStore from '@/store/noteStore';
import { Settings as SettingsIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function NoteLayout() {
  const { notes, folders, createNote, createFolder } = useNoteStore();

  // Create initial data if none exist
  useEffect(() => {
    // Create root folder if it doesn't exist
    if (folders.length === 0) {
      createFolder('All Notes', null);
    }
    
    // Create initial note if none exist
    if (notes.length === 0) {
      createNote();
    }
  }, [notes.length, folders.length, createNote, createFolder]);

  return (
    <div className="flex h-screen overflow-hidden">
      <NoteSidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10"
              asChild
            >
              <Link to="/settings">
                <SettingsIcon className="h-5 w-5" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
        <MarkdownEditor />
      </div>
    </div>
  );
}
