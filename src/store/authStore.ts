import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

type AuthState = {
  user: User | null;
  session: Session | null;
  initializing: boolean;
  isDemoMode: boolean;
  initializeAuth: () => Promise<void>;
  setSession: (session: Session | null) => void;
  loginDemo: () => void;
  logoutDemo: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  initializing: true,
  isDemoMode: false,

  initializeAuth: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({
        session,
        user: session?.user ?? null,
        initializing: false,
        isDemoMode: false,
      });
    } catch {
      set({
        session: null,
        user: null,
        initializing: false,
        isDemoMode: false,
      });
    }
  },

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isDemoMode: false,
    }),

  loginDemo: () =>
    set({
      session: null,
      user: {
        id: 'demo-user',
        email: 'alonso.demo@alphastudio.local',
        app_metadata: {},
        user_metadata: {
          name: 'Alonso',
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User,
      initializing: false,
      isDemoMode: true,
    }),

  logoutDemo: () =>
    set({
      session: null,
      user: null,
      initializing: false,
      isDemoMode: false,
    }),
}));
