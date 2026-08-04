import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../services/supabase";

// 1. Criando a "Nuvem" (O Contexto)
// É aqui que os dados vão flutuar para que qualquer tela possa acessá-los.
const AuthContext = createContext({});

// 2. O Provedor (Componente que vai abraçar toda a nossa aplicação)
export function AuthProvider({ children }) {
  // Estados (memória do componente):
  const [user, setUser] = useState(null); // Guarda os dados básicos do Supabase (e-mail, id)
  const [profile, setProfile] = useState(null); // Guarda o nosso "crachá" (nome, cargo)
  const [loading, setLoading] = useState(true); // Começa como true para mostrar uma tela de carregamento inicial

  // O useEffect roda uma única vez quando o sistema é aberto no navegador
  useEffect(() => {
    // Busca a sessão que já estava salva no navegador (se o usuário não clicou em "sair" ontem, ele continua logado)
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
      setLoading(false); // Terminou de carregar, libera a tela
    }

    loadSession();

    // Cria um "Ouvinte" (Listener) que fica prestando atenção em tempo real.
    // Se a pessoa fizer login em outra aba, ou a sessão expirar, ele atualiza aqui na hora.
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      },
    );

    // Limpeza de memória (Boa prática em React)
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Função interna para ir no banco de dados e buscar o cargo (Admin/Manicure)
  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single(); // Exigimos apenas um resultado

    if (!error && data) {
      setProfile(data);
    }
  }

  // Função que será chamada na tela de Login
  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  // Função que será chamada no botão de Sair
  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Tudo que passamos no "value" estará disponível para o sistema inteiro!
  // O {!loading && children} impede que a tela pisque antes de sabermos se o usuário está logado.
  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 3. Hook Personalizado (A cereja do bolo da arquitetura)
// Em vez de termos que importar dois arquivos enormes em cada tela, criamos esse atalho.
export function useAuth() {
  return useContext(AuthContext);
}
