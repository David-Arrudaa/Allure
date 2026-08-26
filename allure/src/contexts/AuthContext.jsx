import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const { data, error } = await supabase
            .from("profissionais")
            .select("id, nome, email, tenant_id, is_admin")
            .eq("email", session.user.email)
            .single();

          if (data && !error) {
            setUser(data);
            localStorage.setItem("@Allure:profissional", JSON.stringify(data));
          } else {
            setUser(null);
            localStorage.removeItem("@Allure:profissional");
          }
        } else {
          setUser(null);
          localStorage.removeItem("@Allure:profissional");
        }
      } catch (err) {
        console.error("Erro ao inicializar autenticação:", err);
        setUser(null);
        localStorage.removeItem("@Allure:profissional");
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        localStorage.removeItem("@Allure:profissional");
        setLoading(false);
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user?.email) {
          const { data, error } = await supabase
            .from("profissionais")
            .select("id, nome, email, tenant_id, is_admin")
            .eq("email", session.user.email)
            .single();

          if (data && !error) {
            setUser(data);
            localStorage.setItem("@Allure:profissional", JSON.stringify(data));
          }
        }
        setLoading(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  async function login(email, password) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new Error("E-mail ou senha incorretos.");
    }

    const { data, error } = await supabase
      .from("profissionais")
      .select("id, nome, email, tenant_id, is_admin")
      .eq("email", email)
      .single();

    if (error || !data) {
      throw new Error("Perfil não encontrado.");
    }

    setUser(data);
    localStorage.setItem("@Allure:profissional", JSON.stringify(data));
    return data;
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem("@Allure:profissional");
  }

  return (
    <AuthContext.Provider
      value={{ user, profile: user, loading, login, logout }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
