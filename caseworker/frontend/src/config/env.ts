// Environment configuration
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
} as const;

