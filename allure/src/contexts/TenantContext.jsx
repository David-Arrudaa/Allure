import React, { createContext, useState, useEffect, useContext } from "react";
import { getTenantConfig } from "../services/tenantService";

const TenantContext = createContext({});

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTenant() {
      try {
        const hostname = window.location.hostname;
        const config = await getTenantConfig(hostname);
        
        // Injeção de variáveis CSS globais baseadas no Tenant
        document.documentElement.style.setProperty("--cor-primaria", config.theme.primary);
        document.documentElement.style.setProperty("--cor-secundaria", config.theme.secondary);
        
        // Atualiza o title da página
        document.title = config.name;

        setTenant(config);
      } catch (error) {
        console.error("Erro ao carregar tenant:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadTenant();
  }, []);

  // FOUC Prevention: Skeleton global enquanto carrega o tema
  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f8fafc" }}>
        <p>Carregando ambiente...</p>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={{ tenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
