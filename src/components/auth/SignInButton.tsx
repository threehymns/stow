
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function SignInButton() {
  const { signIn, loading } = useAuth();

  return (
    <Button 
      onClick={signIn} 
      disabled={loading}
      variant="outline"
      className="text-sm"
    >
      <LogIn className="mr-2 h-4 w-4" />
      Sign in with Google
    </Button>
  );
}
