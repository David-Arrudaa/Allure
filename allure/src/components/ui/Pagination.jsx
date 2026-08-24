import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  paginaAtual,
  setPaginaAtual,
  totalPaginas,
  totalItems,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem 0",
      }}
    >
      <span style={{ fontSize: "0.9rem", color: "#64748B" }}>
        Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>{" "}
        ({totalItems} registros)
      </span>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
          disabled={paginaAtual === 1}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #CBD5E1",
            backgroundColor: paginaAtual === 1 ? "#F1F5F9" : "#FFFFFF",
            color: paginaAtual === 1 ? "#94A3B8" : "#334155",
            cursor: paginaAtual === 1 ? "not-allowed" : "pointer",
            fontWeight: "500",
          }}
        >
          <ChevronLeft size={16} /> Anterior
        </button>

        <button
          onClick={() =>
            setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
          }
          disabled={paginaAtual === totalPaginas}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #CBD5E1",
            backgroundColor:
              paginaAtual === totalPaginas ? "#F1F5F9" : "#FFFFFF",
            color: paginaAtual === totalPaginas ? "#94A3B8" : "#334155",
            cursor: paginaAtual === totalPaginas ? "not-allowed" : "pointer",
            fontWeight: "500",
          }}
        >
          Próxima <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
