import React from "react";
import { useAuth } from "../contexts/AuthContext";

export function Agenda() {
  // Já estamos puxando o usuário da nossa "nuvem" para testar!
  const { user, profile } = useAuth();

  return (
    <div>
      <h1>Agenda Inteligente</h1>
      {profile && (
        <p>
          Bem-vindo, {profile.nome} (Cargo: {profile.cargo})
        </p>
      )}
    </div>
  );
}
