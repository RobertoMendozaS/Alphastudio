import { supabase } from './supabaseClient';

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  if (error) throw new Error(error.message);
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

export const performCheckIn = async (userId: string) => {
  const { error } = await supabase.from('check_ins').insert([{ user_id: userId }]);
  if (error) {
    if (error.code === '23505') {
      return false;
    }
    throw new Error(`Error al realizar check-in: ${error.message}`);
  }
  return true;
};

export const getStreak = async (userId: string) => {
  const { data, error } = await supabase
    .from('check_ins')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error || !data || data.length === 0) return 0;

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastCheckIn = new Date(data[0].created_at);
  lastCheckIn.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) {
    for (let i = 1; i < data.length; i++) {
      const current = new Date(data[i].created_at);
      const prev = new Date(data[i - 1].created_at);
      current.setHours(0, 0, 0, 0);
      prev.setHours(0, 0, 0, 0);

      const diff = Math.round((prev.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  return 0;
};
