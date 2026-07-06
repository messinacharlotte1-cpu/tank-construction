import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Configuré seulement si les 2 variables publiques sont présentes (front → Supabase direct, RLS impose le tenant).
export const isSupabaseConfigured = Boolean(url && anon);

export const supabase = createClient(url ?? "http://invalid.local", anon ?? "anon-missing");

// Tenant du user courant (via fonction SQL SECURITY DEFINER). Requis pour les inserts (RLS with check).
export async function getTenant(): Promise<string | null> {
  const { data } = await supabase.rpc("current_tenant");
  return (data as string) ?? null;
}

