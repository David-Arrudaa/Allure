import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../services/supabase";

const formatarDataInput = (data) => {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
};

export function useAgenda() {
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [notificacao, setNotificacao] = useState({ visivel: false, mensagem: "", tipo: "sucesso" });

  const mostrarNotificacao = (mensagem, tipo = "sucesso") => {
    setNotificacao({ visivel: true, mensagem, tipo });
    setTimeout(() => setNotificacao({ visivel: false, mensagem: "", tipo: "sucesso" }), 3000);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] = useState(null);
  const [agendamentoParaExcluir, setAgendamentoParaExcluir] = useState(null);
  const [menuAbertoId, setMenuAbertoId] = useState(null);

  const [isModalWhatsAppAberto, setIsModalWhatsAppAberto] = useState(false);
  const [agendamentoParaWhatsApp, setAgendamentoParaWhatsApp] = useState(null);

  const [isModalPagamentoAberto, setIsModalPagamentoAberto] = useState(false);
  const [agendamentoParaPagamento, setAgendamentoParaPagamento] = useState(null);
  const [agendamentoParaDesfazerPagamento, setAgendamentoParaDesfazerPagamento] = useState(null);

  const [isModalRecorrenciaAberto, setIsModalRecorrenciaAberto] = useState(false);
  const [listaRecorrencia, setListaRecorrencia] = useState([]);
  const [grupoRecorrenciaFoco, setGrupoRecorrenciaFoco] = useState(null);
  const [loadingRecorrencia, setLoadingRecorrencia] = useState(false);

  const [modalExclusaoSerieAberto, setModalExclusaoSerieAberto] = useState(false);
  const [itemRecorrenciaParaExcluir, setItemRecorrenciaParaExcluir] = useState(null);

  const [horaAtual, setHoraAtual] = useState(new Date());
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const linhaTempoRef = useRef(null);

  const [agendamentos, setAgendamentos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [profissionaisSelecionados, setProfissionaisSelecionados] = useState([]);
  const [filtrosIniciados, setFiltrosIniciados] = useState(false);
  const [isFiltroAberto, setIsFiltroAberto] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const carregarDadosAgenda = async () => {
    setIsLoading(true);
    try {
      const { data: profsData, error: profsError } = await supabase
        .from("profissionais")
        .select("id, nome, especialidade, foto")
        .order("ordem", { ascending: true });

      if (profsError) throw profsError;
      if (profsData) {
        setProfissionais(profsData);
        if (!filtrosIniciados) {
          setProfissionaisSelecionados(profsData.map((p) => p.id));
          setFiltrosIniciados(true);
        }
      }

      const { data, error } = await supabase.from("appointments").select(`
          *,
          customers ( nome, telefone ),
          profissionais ( id, nome )
        `);

      if (error) throw error;
      if (data) {
        const listaFormatada = data.map((item) => {
          const dataObj = new Date(item.data_horario);
          return {
            id: item.id,
            cliente: item.customers?.nome || "Cliente",
            telefone: item.customers?.telefone || "",
            profissionalId: item.profissional_id,
            profissional: item.profissionais?.nome || "Profissional",
            servico: item.servico,
            horarioInicio: dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            data: formatarDataInput(dataObj),
            dataHoraCompleta: item.data_horario,
            duracao: item.duracao || 60,
            valor: item.valor ? String(item.valor).replace(".", ",") : "0,00",
            status: item.status || "pendente",
            pagamento: item.pagamento || "pendente",
            grupo_recorrencia: item.grupo_recorrencia,
          };
        });
        setAgendamentos(listaFormatada);
      }
    } catch (error) {
      console.error("Erro ao carregar dados da agenda:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosAgenda();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.state && location.state.dataAlvo) {
      setDataSelecionada(new Date(location.state.dataAlvo));
      if (location.state.abrirAgendamentoId && agendamentos.length > 0) {
        const agFoco = agendamentos.find((ag) => ag.id === location.state.abrirAgendamentoId);
        if (agFoco) {
          setAgendamentoParaPagamento(agFoco);
          setIsModalPagamentoAberto(true);
          window.history.replaceState({}, document.title);
        }
      }
    }
  }, [location.state, agendamentos]);

  const handleAbrirRecorrencia = async (ag, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setGrupoRecorrenciaFoco(ag);
    setIsModalRecorrenciaAberto(true);
    setLoadingRecorrencia(true);
    try {
      const hojeStr = formatarDataInput(new Date());
      const { data, error } = await supabase
        .from("appointments")
        .select("*, customers(nome)")
        .eq("grupo_recorrencia", ag.grupo_recorrencia)
        .gte("data_horario", hojeStr)
        .order("data_horario", { ascending: true });

      if (error) throw error;
      setListaRecorrencia(data || []);
    } catch (error) {
      console.error("Erro ao buscar recorrências:", error);
    } finally {
      setLoadingRecorrencia(false);
    }
  };

  const executarExclusaoSerie = async () => {
    try {
      const hojeStr = formatarDataInput(new Date());
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("grupo_recorrencia", grupoRecorrenciaFoco.grupo_recorrencia)
        .gte("data_horario", hojeStr);

      if (error) throw error;
      setModalExclusaoSerieAberto(false);
      setIsModalRecorrenciaAberto(false);
      carregarDadosAgenda();
      mostrarNotificacao("Série de agendamentos excluída!");
    } catch (error) {
      console.error("Erro ao excluir série:", error);
    }
  };

  const executarExclusaoItemUnico = async () => {
    if (!itemRecorrenciaParaExcluir) return;
    try {
      const { error } = await supabase.from("appointments").delete().eq("id", itemRecorrenciaParaExcluir.id);
      if (error) throw error;
      setListaRecorrencia((prev) => prev.filter((item) => item.id !== itemRecorrenciaParaExcluir.id));
      setItemRecorrenciaParaExcluir(null);
      carregarDadosAgenda();
      mostrarNotificacao("Agendamento removido da série.");
      if (listaRecorrencia.length <= 1) setIsModalRecorrenciaAberto(false);
    } catch (error) {
      console.error("Erro ao excluir agendamento da série:", error);
    }
  };

  const alterarStatus = async (id, novoStatus) => {
    try {
      const { error } = await supabase.from("appointments").update({ status: novoStatus }).eq("id", id);
      if (error) throw error;
      carregarDadosAgenda();
      mostrarNotificacao(`Agendamento marcado como ${novoStatus}!`);
    } catch (error) {
      console.error("Erro ao alterar status:", error.message);
    }
  };

  const confirmarExclusao = async () => {
    if (!agendamentoParaExcluir) return;
    try {
      const { error } = await supabase.from("appointments").delete().eq("id", agendamentoParaExcluir.id);
      if (error) throw error;
      setAgendamentoParaExcluir(null);
      carregarDadosAgenda();
      mostrarNotificacao("Agendamento excluído com sucesso.", "excluir");
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error.message);
    }
  };

  const handleAbrirPagamento = (ag, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (ag.pagamento === "pago") {
      setAgendamentoParaDesfazerPagamento(ag);
    } else {
      setAgendamentoParaPagamento(ag);
      setIsModalPagamentoAberto(true);
    }
  };

  return {
    isLoading,
    notificacao,
    mostrarNotificacao,
    isModalOpen, setIsModalOpen,
    agendamentoEditando, setAgendamentoEditando,
    agendamentoParaExcluir, setAgendamentoParaExcluir,
    menuAbertoId, setMenuAbertoId,
    isModalWhatsAppAberto, setIsModalWhatsAppAberto,
    agendamentoParaWhatsApp, setAgendamentoParaWhatsApp,
    isModalPagamentoAberto, setIsModalPagamentoAberto,
    agendamentoParaPagamento, setAgendamentoParaPagamento,
    agendamentoParaDesfazerPagamento, setAgendamentoParaDesfazerPagamento,
    isModalRecorrenciaAberto, setIsModalRecorrenciaAberto,
    listaRecorrencia, setListaRecorrencia,
    grupoRecorrenciaFoco, setGrupoRecorrenciaFoco,
    loadingRecorrencia, setLoadingRecorrencia,
    modalExclusaoSerieAberto, setModalExclusaoSerieAberto,
    itemRecorrenciaParaExcluir, setItemRecorrenciaParaExcluir,
    horaAtual, setHoraAtual,
    dataSelecionada, setDataSelecionada,
    linhaTempoRef,
    agendamentos, setAgendamentos,
    profissionais, setProfissionais,
    profissionaisSelecionados, setProfissionaisSelecionados,
    filtrosIniciados, setFiltrosIniciados,
    isFiltroAberto, setIsFiltroAberto,
    carregarDadosAgenda,
    handleAbrirRecorrencia,
    executarExclusaoSerie,
    executarExclusaoItemUnico,
    alterarStatus,
    confirmarExclusao,
    handleAbrirPagamento
  };
}
