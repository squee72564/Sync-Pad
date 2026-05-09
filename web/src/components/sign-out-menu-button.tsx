import { BotIcon, LogOutIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AuthContext } from '#/lib/auth-context';
import { SidebarMenuButton } from './ui/sidebar';

export default function SignOutMenuButton({ auth }: { auth: AuthContext }) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    await auth.signOut({
      fetchOptions: {
        onRequest: () => {
          setIsSigningOut(true);
        },
        onSuccess: () => {
          setIsSigningOut(false);
          toast.success('Signed out');
          window.location.assign('/signin');
        },
        onError: (ctx) => {
          setIsSigningOut(false);
          toast.error(ctx.error.message || 'Unable to sign out.');
        },
      },
    });
  }

  return (
    <SidebarMenuButton
      tooltip={isSigningOut ? 'Signing out...' : 'Sign out'}
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="border border-sidebar-border/70 bg-sidebar-accent/30 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center"
    >
      {isSigningOut ? (
        <BotIcon className="size-4 animate-pulse group-data-[collapsible=icon]:size-3.5" />
      ) : (
        <LogOutIcon className="size-4 group-data-[collapsible=icon]:size-3.5" />
      )}
      <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
    </SidebarMenuButton>
  );
}
