import { CheckCircle2, Trash2 } from "lucide-react";
import { useAgenda } from "./useAgenda";
import { AgendaTopbar } from "./AgendaTopbar";
import { CalendarGrid } from "./CalendarGrid";
import { AgendaModals } from "./AgendaModals";
import { formatarDataInput } from "./utils";

export function Agenda() {
  const agenda = useAgenda();

  const diaAnterior = () => {
    const novaData = new Date(agenda.dataSelecionada);
    novaData.setDate(novaData.getDate() - 1);
    agenda.setDataSelecionada(novaData);
  };

  const proximoDia = () => {
    const novaData = new Date(agenda.dataSelecionada);
    novaData.setDate(novaData.getDate() + 1);
    agenda.setDataSelecionada(novaData);
  };

  const irParaHoje = () => agenda.setDataSelecionada(new Date());

  const dataSelecionadaString = formatarDataInput(agenda.dataSelecionada);
  const agendamentosDoDia = agenda.agendamentos.filter(
    (ag) => ag.data === dataSelecionadaString,
  );
  
  const qtdAtendimentosDia = agendamentosDoDia.filter(
    (ag) => ag.status !== "bloqueio",
  ).length;

  const agendamentosOrfaos = agendamentosDoDia.filter(
    (ag) => !agenda.profissionais.some((p) => p.id === ag.profissionalId),
  );

  const hoje = new Date();
  const isHoje =
    agenda.dataSelecionada.getDate() === hoje.getDate() &&
    agenda.dataSelecionada.getMonth() === hoje.getMonth() &&
    agenda.dataSelecionada.getFullYear() === hoje.getFullYear();

  const minutosAtuais = agenda.horaAtual.getHours() * 60 + agenda.horaAtual.getMinutes();
  const posicaoLinhaTempo = (minutosAtuais * 2) + 74;
  const mostrarLinhaTempo = isHoje && posicaoLinhaTempo >= 74 && posicaoLinhaTempo <= (24 * 60 * 2) + 74;

  return (
    <div
      className="bg-white rounded-[var(--raio-borda)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 h-full max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden max-md:p-3 max-md:h-[calc(100dvh-115px)]"
      onClick={() => {
        agenda.setMenuAbertoId(null);
        agenda.setIsFiltroAberto(false);
      }}
    >
      {agenda.notificacao.visivel && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: agenda.notificacao.tipo === "excluir" ? "#EF4444" : "#10B981",
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 9999,
            fontWeight: "600",
            fontSize: "0.95rem",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          {agenda.notificacao.tipo === "excluir" ? <Trash2 size={20} /> : <CheckCircle2 size={20} />}
          {agenda.notificacao.mensagem}
        </div>
      )}

      <AgendaTopbar
        isLoading={agenda.isLoading}
        qtdAtendimentosDia={qtdAtendimentosDia}
        dataSelecionada={agenda.dataSelecionada}
        setDataSelecionada={agenda.setDataSelecionada}
        diaAnterior={diaAnterior}
        irParaHoje={irParaHoje}
        proximoDia={proximoDia}
        isFiltroAberto={agenda.isFiltroAberto}
        setIsFiltroAberto={agenda.setIsFiltroAberto}
        profissionais={agenda.profissionais}
        profissionaisSelecionados={agenda.profissionaisSelecionados}
        setProfissionaisSelecionados={agenda.setProfissionaisSelecionados}
        setAgendamentoEditando={agenda.setAgendamentoEditando}
        setIsModalOpen={agenda.setIsModalOpen}
      />

      <CalendarGrid
        isLoading={agenda.isLoading}
        profissionais={agenda.profissionais}
        profissionaisSelecionados={agenda.profissionaisSelecionados}
        agendamentosDoDia={agendamentosDoDia}
        agendamentosOrfaos={agendamentosOrfaos}
        mostrarLinhaTempo={mostrarLinhaTempo}
        posicaoLinhaTempo={posicaoLinhaTempo}
        linhaTempoRef={agenda.linhaTempoRef}
        dataSelecionada={agenda.dataSelecionada}
        setAgendamentoEditando={agenda.setAgendamentoEditando}
        setIsModalOpen={agenda.setIsModalOpen}
        setAgendamentoParaExcluir={agenda.setAgendamentoParaExcluir}
        menuAbertoId={agenda.menuAbertoId}
        setMenuAbertoId={agenda.setMenuAbertoId}
        setAgendamentoParaWhatsApp={agenda.setAgendamentoParaWhatsApp}
        setIsModalWhatsAppAberto={agenda.setIsModalWhatsAppAberto}
        handleAbrirPagamento={agenda.handleAbrirPagamento}
        alterarStatus={agenda.alterarStatus}
        handleAbrirRecorrencia={agenda.handleAbrirRecorrencia}
      />

      <AgendaModals
        isModalOpen={agenda.isModalOpen}
        setIsModalOpen={agenda.setIsModalOpen}
        agendamentoEditando={agenda.agendamentoEditando}
        carregarDadosAgenda={agenda.carregarDadosAgenda}
        mostrarNotificacao={agenda.mostrarNotificacao}
        isModalPagamentoAberto={agenda.isModalPagamentoAberto}
        setIsModalPagamentoAberto={agenda.setIsModalPagamentoAberto}
        agendamentoParaPagamento={agenda.agendamentoParaPagamento}
        isModalWhatsAppAberto={agenda.isModalWhatsAppAberto}
        setIsModalWhatsAppAberto={agenda.setIsModalWhatsAppAberto}
        agendamentoParaWhatsApp={agenda.agendamentoParaWhatsApp}
        isModalRecorrenciaAberto={agenda.isModalRecorrenciaAberto}
        setIsModalRecorrenciaAberto={agenda.setIsModalRecorrenciaAberto}
        loadingRecorrencia={agenda.loadingRecorrencia}
        listaRecorrencia={agenda.listaRecorrencia}
        grupoRecorrenciaFoco={agenda.grupoRecorrenciaFoco}
        setAgendamentoEditando={agenda.setAgendamentoEditando}
        setItemRecorrenciaParaExcluir={agenda.setItemRecorrenciaParaExcluir}
        setModalExclusaoSerieAberto={agenda.setModalExclusaoSerieAberto}
        modalExclusaoSerieAberto={agenda.modalExclusaoSerieAberto}
        setModalExclusaoSerieAbertoState={agenda.setModalExclusaoSerieAberto}
        executarExclusaoSerie={agenda.executarExclusaoSerie}
        itemRecorrenciaParaExcluir={agenda.itemRecorrenciaParaExcluir}
        setItemRecorrenciaParaExcluirState={agenda.setItemRecorrenciaParaExcluir}
        executarExclusaoItemUnico={agenda.executarExclusaoItemUnico}
        agendamentoParaDesfazerPagamento={agenda.agendamentoParaDesfazerPagamento}
        setAgendamentoParaDesfazerPagamento={agenda.setAgendamentoParaDesfazerPagamento}
        agendamentoParaExcluir={agenda.agendamentoParaExcluir}
        setAgendamentoParaExcluir={agenda.setAgendamentoParaExcluir}
        confirmarExclusao={agenda.confirmarExclusao}
      />
    </div>
  );
}
