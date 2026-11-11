/**
 * Variáveis de ambiente públicas. O Expo só injeta `EXPO_PUBLIC_*` quando o
 * acesso é feito de forma literal (`process.env.EXPO_PUBLIC_X`).
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export const env = {
  supabaseUrl,
  supabasePublishableKey,
  isSupabaseConfigured: supabaseUrl.length > 0 && supabasePublishableKey.length > 0,
} as const;
