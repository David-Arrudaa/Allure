import { createClient } from "@supabase/supabase-js";

// Buscando as chaves do nosso arquivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    "[Allure] Atenção: As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram encontradas no arquivo .env.local. Configure-as para conectar ao banco Supabase."
  );
}

// Criando a conexão oficial (o "cliente") com o banco
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
