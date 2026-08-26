export const formatarDataInput = (data) => {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
};

export const formatarDataExibicao = (data) => {
  const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return `${dias[data.getDay()]}, ${String(data.getDate()).padStart(2, "0")} de ${meses[data.getMonth()]}`;
};

export const calcularPosicao = (horarioString) => {
  if (!horarioString) return 74;
  const [hora, minuto] = horarioString.split(":").map(Number);
  const minutosDesde00h = hora * 60 + minuto;
  return (minutosDesde00h * 2) + 74; // Adiciona os 74px do cabeçalho
};

export const determinarCoresAgendamento = (ag) => {
  if (ag.status === "bloqueio") return { bg: "#F1F5F9", border: "#94A3B8", text: "#64748B" }; // Cinza
  if (ag.status === "cancelado") return { bg: "#FEF2F2", border: "#EF4444", text: "#991B1B" }; // Vermelho
  if (ag.status === "confirmado") return { bg: "#F0FDF4", border: "#22C55E", text: "#166534" }; // Verde
  return { bg: "#EFF6FF", border: "#3B82F6", text: "#1E40AF" }; // Azul/Pendente
};

export const calcularHoraFim = (horaInicio, duracaoMinutos) => {
  if (!horaInicio) return "";
  const [horas, minutos] = horaInicio.split(":").map(Number);
  const data = new Date();
  data.setHours(horas, minutos + Number(duracaoMinutos), 0);
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

export const gerarLinkWhatsapp = (ag, template = 1) => {
  const telefoneLimpo = ag.telefone ? ag.telefone.replace(/\D/g, "") : "";
  let texto = "";
  if (template === 1) {
    texto = `Olá ${ag.cliente}, tudo bem? Seu agendamento de ${ag.servico} está marcado para hoje às ${ag.horarioInicio}!`;
  } else if (template === 2) {
    texto = `Olá ${ag.cliente}, passando para confirmar seu agendamento de ${ag.servico} hoje às ${ag.horarioInicio}. O valor é R$ ${ag.valor}. Te aguardamos!`;
  }
  const mensagem = encodeURIComponent(texto);
  return telefoneLimpo
    ? `https://wa.me/55${telefoneLimpo}?text=${mensagem}`
    : `https://wa.me/?text=${mensagem}`;
};
