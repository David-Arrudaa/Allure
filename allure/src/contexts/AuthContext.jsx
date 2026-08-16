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
    setLoading(false);
  }, []);

  async function login(email, password) {
    const { data, error } = await supabase
      .from("profissionais")
      .select("*")
      .eq("email", email)
      .eq("senha", password)
      .single();

    if (error || !data) {
      throw new Error("E-mail ou senha incorretos.");
    }

    setUser(data);
    localStorage.setItem("@Allure:profissional", JSON.stringify(data));
    return data;
  }

  async function logout() {
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
