import { memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SignInButton } from "./SignInButton";
import { UserMenu } from "./UserMenu";

export const AuthStatus = memo(function AuthStatusComponent() {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />;
  }
  return user ? <UserMenu /> : <SignInButton />;
});
