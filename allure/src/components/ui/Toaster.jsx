import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { ouvirToasts } from "../../lib/toast";

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return ouvirToasts((novo) => {
      setToasts((prev) => [...prev, novo]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== novo.id));
      }, 3500);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => {
        const isSucesso = t.tipo === "sucesso";
        return (
          <div
            key={t.id}
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 18px",
              borderRadius: "10px",
              backgroundColor: isSucesso ? "#10B981" : "#EF4444",
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: "0.95rem",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
              animation: "slideIn 0.25s ease-out",
            }}
          >
            {isSucesso ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span>{t.mensagem}</span>
            <button
              type="button"
              onClick={() =>
                setToasts((prev) => prev.filter((item) => item.id !== t.id))
              }
              style={{
                background: "transparent",
                border: "none",
                color: "#FFFFFF",
                cursor: "pointer",
                padding: "2px",
                marginLeft: "4px",
                display: "flex",
              }}
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
