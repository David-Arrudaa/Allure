import { useEffect } from "react";

// Fecha o modal com a tecla Esc. Os overlays não fecham mais no clique (para
// não perder formulário preenchido por toque acidental), então sem isto
// sobraria apenas o X como via de saída.
// ponytail: não trata modal sobre modal — se dois estiverem abertos, ambos
// recebem o Esc. Adicionar um contador/contexto de pilha se isso aparecer.
export function useEscapeKey(onEscape, ativo = true) {
  useEffect(() => {
    if (!ativo) return;
    const aoTeclar = (evento) => {
      if (evento.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onEscape, ativo]);
}
