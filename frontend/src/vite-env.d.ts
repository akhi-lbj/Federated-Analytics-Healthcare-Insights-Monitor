/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_RAM_GATEWAY_URL: string;
  readonly VITE_DEFAULT_TEAM_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
