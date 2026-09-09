// Toast minimalista sem dependência externa: pub/sub simples que o
// <Toaster /> (montado uma vez em App.jsx) consome.
// skipped: fila com stacking configurável, ação de desfazer -> sonner se crescer.
let idSeq = 0;
const listeners = new Set();

function emitir(mensagem, tipo) {
  const item = { id: ++idSeq, mensagem, tipo };
  listeners.forEach((fn) => fn(item));
  return item.id;
}

export const toast = {
  success: (mensagem) => emitir(mensagem, "sucesso"),
  error: (mensagem) => emitir(mensagem, "erro"),
};

export function ouvirToasts(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
