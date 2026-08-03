import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

/**
 * Thin wrapper over Better Auth's `useSession` that preserves the shape the app
 * already consumes ({ session, user, loading, isAuthenticated }).
 *
 * The server always renders the signed-out state (there is no browser session
 * during SSR). Better Auth restores the session on the client after hydration,
 * so we gate on `hydrated` to keep the first client render identical to the
 * server and avoid a hydration mismatch.
 */
export function useAuth() {
  const { data, isPending } = useSession();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const session = hydrated ? (data ?? null) : null;
  const user = session?.user ?? null;

  return {
    session,
    user,
    loading: hydrated ? isPending : true,
    isAuthenticated: Boolean(user),
  };
}
