// Environment configuration
// Ensure API URL always has a protocol to prevent relative URL issues
const getApiUrlWithProtocol = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  // If URL doesn't start with http:// or https://, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

export const config = {
  apiUrl: getApiUrlWithProtocol(),
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
} as const;

