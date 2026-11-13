import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { normalizeName } from "@/lib/validation";

export type User = {
  id: string;
  fullName: string;
  firstName: string;
  initials: string;
  email: string;
  phone: string;
  school: string;
};

export type ProfileChanges = { fullName: string; phone: string; school: string };
export type AuthResult = { ok: true } | { ok: false; error: string };
export type ResetRequest = { ok: true; code: string } | { ok: false; error: string };

type AuthContextValue = {
  user: User;
  isSignedIn: boolean;
  /** True while the saved session is being restored on app start. */
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (fullName: string, email: string, password: string) => Promise<AuthResult>;
  /** Creates a 6-digit code. There is no email server, so the code is returned to show on screen. */
  requestPasswordReset: (email: string) => Promise<ResetRequest>;
  verifyResetCode: (email: string, code: string) => Promise<AuthResult>;
  setNewPassword: (password: string) => Promise<AuthResult>;
  /** Accounts on this device whose name or email matches. Never includes the signed-in user. */
  searchUsers: (query: string) => { id: string; fullName: string; email: string }[];
  signOut: () => Promise<void>;
  updateProfile: (changes: ProfileChanges) => Promise<AuthResult>;
};

type Account = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  school: string;
  salt: string;
  hash: string;
};

type Accounts = Record<string, Account>; // keyed by lower-cased email

const ACCOUNTS_KEY = "taskflow.accounts.v1";
const SESSION_KEY = "taskflow.session.v1";
const CODE_TTL_MS = 10 * 60 * 1000;

const keyOf = (email: string) => email.trim().toLowerCase();

async function hashPassword(password: string, salt: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
}

function toUser(a: Account): User {
  const name = normalizeName(a.fullName);
  const parts = name.split(" ").filter(Boolean);
  const firstName = parts[0] ?? a.email.split("@")[0];
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : firstName.slice(0, 2);
  return {
    id: a.id,
    fullName: name || a.email,
    firstName,
    initials: initials.toUpperCase(),
    email: a.email,
    phone: a.phone,
    school: a.school,
  };
}

const SIGNED_OUT: User = { id: "", fullName: "", firstName: "", initials: "?", email: "", phone: "", school: "" };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Accounts>({});
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Always-current copies for async callbacks.
  const accountsRef = useRef<Accounts>({});
  // email -> { code, expires, verified }
  const resets = useRef<Record<string, { code: string; expires: number; verified: boolean }>>({});

  useEffect(() => {
    (async () => {
      try {
        const [rawAccounts, rawSession] = await Promise.all([
          AsyncStorage.getItem(ACCOUNTS_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ]);
        const loaded: Accounts = rawAccounts ? JSON.parse(rawAccounts) : {};
        accountsRef.current = loaded;
        setAccounts(loaded);
        if (rawSession && loaded[rawSession]) setSessionKey(rawSession);
      } catch {
        // Corrupt or unavailable storage: start fresh rather than crash.
      }
      setIsLoading(false);
    })();
  }, []);

  const saveAccounts = useCallback(async (next: Accounts) => {
    accountsRef.current = next;
    setAccounts(next);
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
  }, []);

  const startSession = useCallback(async (key: string) => {
    setSessionKey(key);
    await AsyncStorage.setItem(SESSION_KEY, key);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const key = keyOf(email);
      const account = accountsRef.current[key];
      if (!account || (await hashPassword(password, account.salt)) !== account.hash) {
        return { ok: false, error: "Wrong email or password." };
      }
      await startSession(key);
      return { ok: true };
    },
    [startSession],
  );

  const signUp = useCallback(
    async (fullName: string, email: string, password: string): Promise<AuthResult> => {
      const key = keyOf(email);
      if (accountsRef.current[key]) {
        return { ok: false, error: "An account with this email already exists. Log in instead." };
      }
      const salt = Crypto.randomUUID();
      const account: Account = {
        id: Crypto.randomUUID(),
        fullName: normalizeName(fullName),
        email: email.trim(),
        phone: "",
        school: "",
        salt,
        hash: await hashPassword(password, salt),
      };
      await saveAccounts({ ...accountsRef.current, [key]: account });
      await startSession(key);
      return { ok: true };
    },
    [saveAccounts, startSession],
  );

  const requestPasswordReset = useCallback(async (email: string): Promise<ResetRequest> => {
    const key = keyOf(email);
    if (!accountsRef.current[key]) {
      return { ok: false, error: "No account on this device uses that email." };
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    resets.current[key] = { code, expires: Date.now() + CODE_TTL_MS, verified: false };
    return { ok: true, code };
  }, []);

  const verifyResetCode = useCallback(async (email: string, code: string): Promise<AuthResult> => {
    const key = keyOf(email);
    const pending = resets.current[key];
    if (!pending || Date.now() > pending.expires || pending.code !== code.trim()) {
      return { ok: false, error: "That code is wrong or has expired. Request a new one." };
    }
    pending.verified = true;
    return { ok: true };
  }, []);

  // Only works for the email whose code was just verified.
  const setNewPassword = useCallback(
    async (password: string): Promise<AuthResult> => {
      const key = Object.keys(resets.current).find((k) => resets.current[k].verified);
      const account = key ? accountsRef.current[key] : undefined;
      if (!key || !account) return { ok: false, error: "Your reset session expired. Start again." };
      const salt = Crypto.randomUUID();
      await saveAccounts({
        ...accountsRef.current,
        [key]: { ...account, salt, hash: await hashPassword(password, salt) },
      });
      delete resets.current[key];
      await startSession(key);
      return { ok: true };
    },
    [saveAccounts, startSession],
  );

  const searchUsers = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      return Object.entries(accountsRef.current)
        .filter(([key]) => key !== sessionKey)
        .map(([, a]) => ({ id: a.id, fullName: a.fullName || a.email, email: a.email }))
        .filter((p) => !q || p.fullName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))
        .sort((a, b) => a.fullName.localeCompare(b.fullName))
        .slice(0, 8);
    },
    [sessionKey],
  );

  const signOut = useCallback(async () => {
    setSessionKey(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  }, []);

  const updateProfile = useCallback(
    async (changes: ProfileChanges): Promise<AuthResult> => {
      const account = sessionKey ? accountsRef.current[sessionKey] : undefined;
      if (!sessionKey || !account) return { ok: false, error: "You're not signed in." };
      await saveAccounts({
        ...accountsRef.current,
        [sessionKey]: {
          ...account,
          fullName: normalizeName(changes.fullName),
          phone: changes.phone.trim(),
          school: changes.school.trim(),
        },
      });
      return { ok: true };
    },
    [sessionKey, saveAccounts],
  );

  const current = sessionKey ? accounts[sessionKey] : undefined;
  const user = useMemo(() => (current ? toUser(current) : SIGNED_OUT), [current]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isSignedIn: current !== undefined,
      isLoading,
      signIn,
      signUp,
      requestPasswordReset,
      verifyResetCode,
      setNewPassword,
      searchUsers,
      signOut,
      updateProfile,
    }),
    [user, current, isLoading, signIn, signUp, requestPasswordReset, verifyResetCode, setNewPassword, searchUsers, signOut, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
