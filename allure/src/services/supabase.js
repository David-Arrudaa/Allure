import { createClient } from "@supabase/supabase-js";

// Buscando as chaves secretas do nosso arquivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Criando a conexão oficial (o "cliente") com o banco
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
