// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let mounted = true;

    // 初期セッション取得
    supabase.auth.getSession()
      .then(({ data }) => { if (mounted) setSession(data.session || null); })
      .catch((e) => { if (mounted) setAuthError(e); })
      .finally(() => { if (mounted) setAuthLoading(false); });

    // 以降の変化を購読
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (mounted) setSession(sess);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let aborted = false;

    const fetchProfile = async () => {
      if (!session?.user) { setProfile(null); return; }

      const { data, error } = await supabase
        .from('store_members')
        .select('store_id, role')
        .eq('user_id', session.user.id)
        .limit(1)
        .maybeSingle();

      if (aborted) return;
      if (error) {
        // 必要ならここでエラー表示
        console.warn('fetchProfile error:', error.message);
        setProfile({ user: session.user, defaultStoreId: null, role: 'owner' });
        return;
      }
      setProfile({ user: session.user, defaultStoreId: data?.store_id || null, role: data?.role || 'owner' });
    };

    fetchProfile();
    return () => { aborted = true; };
  }, [session]);

  // 不要な再レンダーを抑える
  const value = useMemo(() => ({
    session,
    profile,
    authLoading,
    authError,
    signOut: () => supabase.auth.signOut(),
  }), [session, profile, authLoading, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    console.error('useAuth must be used within <AuthProvider>');
    return null; // Provider未装着時、呼び出し側でガード
  }
  return ctx;
};
