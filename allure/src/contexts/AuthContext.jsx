import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const profissionalSalva = localStorage.getItem("@Allure:profissional");
    if (profissionalSalva) {
      setUser(JSON.parse(profissionalSalva));
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        localStorage.removeItem("@Allure:profissional");
      }
    });

    setLoading(false);

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
