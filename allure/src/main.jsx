import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";
import { AuthProvider } from "./contexts/AuthContext.jsx"; // <-- Importando o Provedor

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* A Nuvem agora cobre todo o App */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
