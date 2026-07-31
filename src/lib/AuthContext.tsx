"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { Session, User } from "@supabase/supabase-js";

type UserProfile = { role?: string; [key: string]: any };
type AuthContextType = {
  session: Session | null;
  user: User | null;
  userData: UserProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ session: null, user: null, userData: null, loading: true });
const AUTH_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: PromiseLike<T>, operation: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(`${operation} melebihi batas waktu.`)), AUTH_TIMEOUT_MS);
    Promise.resolve(promise).then(
      (value) => { window.clearTimeout(timeout); resolve(value); },
      (error) => { window.clearTimeout(timeout); reject(error); }
    );
  });
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const fetchUserData = async (currentUser: User, id: number) => {
    try {
      const { data, error } = await withTimeout(
        supabase.from("users").select("*").eq("id", currentUser.id).maybeSingle(),
        "Mengambil profil pengguna"
      );
      if (error) throw error;

      if (id === requestId.current) setUserData(data as UserProfile | null);
    } catch {
      // RLS/database errors must not leave auth loading forever. The database
      // policy migration provides the required access for authenticated users.
      if (id === requestId.current) setUserData(null);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    const applySession = (nextSession: Session | null) => {
      const id = ++requestId.current;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setUserData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      void fetchUserData(nextSession.user, id);
    };

    const loadInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await withTimeout(
          supabase.auth.getSession(),
          "Memeriksa sesi login"
        );
        if (error) throw error;
        applySession(initialSession);
      } catch {
        applySession(null);
      }
    };

    void loadInitialSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => applySession(nextSession));
    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, user, userData, loading }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
