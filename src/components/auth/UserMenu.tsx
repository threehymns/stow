import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "??";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full py-6 px-2 justify-start hover:bg-muted">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={user?.email || "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-foreground font-semibold">{user?.user_metadata?.name || user?.email}</span>
            {user?.email && <p className="text-xs text-muted-foreground">{user.email.split('@')[0]}</p>}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        <DropdownMenuLabel className="flex items-center py-6 flex-col">
          <Avatar className="h-8 w-8 mb-3">
            <AvatarImage src={avatarUrl} alt={user?.email || "User"} />as
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="text-foreground font-semibold">{user?.user_metadata?.name || user?.email}</span>
          {user?.email && <p className="text-xs text-muted-foreground font-normal">{user.email}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            to="/settings"
            className="flex w-full cursor-pointer items-center"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={signOut}
          className="focus:text-destructive focus:bg-destructive/20"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
