import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { isDemoMode } from './config';
import { supabase } from './supabase';
import {
  demoGetSession,
  demoSignIn,
  demoSignUp,
  demoSignOut,
  demoResetPassword,
  demoIsAdmin,
  demoBecomeAdmin,
} from './demo-store';

type AuthState = {
  user: any | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; ok?: boolean }>;
  becomeAdmin: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
};

const Ctx = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = useCallback(async (uid: string | undefined) => {
    if (!uid) { setIsAdmin(false); return; }
    try {
      if (isDemoMode) {
        setIsAdmin(await demoIsAdmin(uid));
        return;
      }
      const { data } = await supabase.from('admin_users').select('user_id').eq('user_id', uid).maybeSingle();
      setIsAdmin(!!data);
    } catch { setIsAdmin(false); }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (isDemoMode) {
          const session = await demoGetSession();
          const u = session?.user ?? null;
          if (!mounted) return;
          setUser(u);
          await checkAdmin(u?.id);
        } else {
          const { data } = await supabase.auth.getSession();
          const u = data?.session?.user ?? null;
          if (!mounted) return;
          setUser(u);
          await checkAdmin(u?.id);
        }
      } catch {
        // never crash
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    if (isDemoMode) return () => { mounted = false; };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      checkAdmin(u?.id);
    });
    return () => { mounted = false; sub?.subscription?.unsubscribe?.(); };
  }, [checkAdmin]);

  const signIn = async (email: string, password: string) => {
    try {
      if (isDemoMode) {
        const r = await demoSignIn(email, password);
        if (r.error) return { error: r.error };
        if (r.user) { setUser(r.user); await checkAdmin(r.user.id); }
        return {};
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return { error: error.message };
      return {};
    } catch (e: any) { return { error: e?.message || 'Network error. Please retry.' }; }
  };

  const signUp = async (email: string, password: string) => {
    try {
      if (isDemoMode) {
        const r = await demoSignUp(email, password);
        if (r.error) return { error: r.error };
        if (r.user) { setUser(r.user); await checkAdmin(r.user.id); }
        return {};
      }
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) return { error: error.message };
      return {};
    } catch (e: any) { return { error: e?.message || 'Network error. Please retry.' }; }
  };

  const resetPassword = async (email: string) => {
    try {
      if (isDemoMode) return demoResetPassword(email);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) return { error: error.message };
      return { ok: true };
    } catch (e: any) { return { error: e?.message || 'Network error.' }; }
  };

  const signOut = async () => {
    try {
      if (isDemoMode) await demoSignOut();
      else await supabase.auth.signOut();
    } catch {}
    setUser(null); setIsAdmin(false);
  };

  const refreshAdmin = async () => { await checkAdmin(user?.id); };

  const becomeAdmin = async () => {
    if (!user?.id) return;
    try {
      if (isDemoMode) {
        await demoBecomeAdmin(user.id);
        await checkAdmin(user.id);
        return;
      }
      await supabase.from('admin_users').insert({ user_id: user.id });
      await checkAdmin(user.id);
    } catch {}
  };

  return (
    <Ctx.Provider value={{ user, isAdmin, loading, signIn, signUp, signOut, resetPassword, becomeAdmin, refreshAdmin }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
