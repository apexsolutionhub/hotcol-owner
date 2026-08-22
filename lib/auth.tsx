import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { OWNER_TOKEN_KEY, SELECTED_TIN_KEY } from "@/constants/config";
import { setAuthToken, setUnauthorizedHandler } from "./api";
import { deleteItem, getItem, setItem } from "./storage";
import { fetchOwnerMe, loginRequest } from "./queries";
import type { Owner } from "./types";

type AuthState = {
  owner: Owner | null;
  initializing: boolean;
  signIn: (userName: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setOwner: (owner: Owner | null) => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [initializing, setInitializing] = useState(true);

  const signOut = useCallback(async () => {
    setAuthToken(null);
    setOwner(null);
    await Promise.all([deleteItem(OWNER_TOKEN_KEY), deleteItem(SELECTED_TIN_KEY)]);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    (async () => {
      try {
        const token = await getItem(OWNER_TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          const me = await fetchOwnerMe();
          if (me) setOwner(me);
          else await signOut();
        }
      } catch {
        await signOut();
      } finally {
        setInitializing(false);
      }
    })();
  }, [signOut]);

  const signIn = useCallback(async (userName: string, password: string) => {
    const { token, owner: loggedIn } = await loginRequest(userName.trim(), password);
    setAuthToken(token);
    await setItem(OWNER_TOKEN_KEY, token);
    setOwner(loggedIn);
  }, []);

  const value = useMemo(
    () => ({ owner, initializing, signIn, signOut, setOwner }),
    [owner, initializing, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
