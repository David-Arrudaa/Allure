import { useState, useMemo, useEffect } from "react";
import {
  GraduationCap,
  Calendar,
  DollarSign,
  Users,
  Plus,
  Search,
  ChevronRight,
  Clock,
  User,
  CreditCard,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Receipt,
  UserPlus,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCursos, useTurmaDetalhes } from "../../hooks/useCursos";
import { useEquipe } from "../../hooks/useEquipe";
import { ModalCurso } from "../../components/domain/ModalCurso";
import { ModalTurma } from "../../components/domain/ModalTurma";
import { ModalMatricula } from "../../components/domain/ModalMatricula";
import { ModalPagamentoCurso } from "../../components/domain/ModalPagamentoCurso";
import { Pagination } from "../../components/ui/Pagination";
import { toast } from "../../lib/toast";

const ITENS_POR_PAGINA_EXTRATO = 30;
const TURMAS_POR_PAGINA = 12;

export function Cursos() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  // Estado das Abas Principais
  const [abaAtiva, setAbaAtiva] = useState("turmas"); // 'turmas' | 'catalogo' | 'financeiro'

  // Turma Selecionada para visualização detalhada
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState(null);

  // Modais
  const [modalCursoAberto, setModalCursoAberto] = useState(false);
  const [cursoEditando, setCursoEditando] = useState(null);

  const [modalTurmaAberto, setModalTurmaAberto] = useState(false);
  const [turmaEditando, setTurmaEditando] = useState(null);

  const [modalMatriculaAberto, setModalMatriculaAberto] = useState(false);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [matriculaParaPagamento, setMatriculaParaPagamento] = useState(null);

  // Busca e Filtros
  const [busca, setBusca] = useState("");
  const [filtroStatusTurma, setFiltroStatusTurma] = useState("todas");
  const [buscaExtrato, setBuscaExtrato] = useState("");
  const [filtroFormaExtrato, setFiltroFormaExtrato] = useState("todas");
  const [periodoFinanceiro, setPeriodoFinanceiro] = useState("mes"); // 'mes' | 'ano' | 'todos' | 'custom'
  const [dataInicioCustom, setDataInicioCustom] = useState("");
  const [dataFimCustom, setDataFimCustom] = useState("");
  const [paginaExtrato, setPaginaExtrato] = useState(1);
  const [paginaTurmas, setPaginaTurmas] = useState(1);

  // Hook Principal
  const {
    cursos,
    turmas,
    metricas,
    isLoading,
    criarCurso,
    atualizarCurso,
    excluirCurso,
    criarTurma,
    atualizarTurma,
    excluirTurma,
    isSalvando,
  } = useCursos();

  // Hook de Instrutores / Equipe do Tenant
  const { equipe: instrutores = [] } = useEquipe();

  // Hook Detalhes da Turma Ativa
  const {
    turma: turmaAtiva,
    isLoading: isLoadingTurma,
    matricularAluna,
    excluirMatricula,
    registrarPagamento,
    excluirPagamento,
    isSalvando: isSalvandoTurma,
  } = useTurmaDetalhes(turmaSelecionadaId);

  // Ações de Exclusão
  const handleExcluirCurso = async (curso) => {
    if (
      !window.confirm(
        `Deseja realmente excluir o curso "${curso.nome}"? Turmas vinculadas também serão removidas.`
      )
    )
      return;
    try {
      await excluirCurso(curso.id);
      toast.success("Curso excluído com sucesso!");
    } catch (err) {
      toast.error("Erro ao excluir o curso.");
    }
  };

  const handleExcluirTurma = async (turma) => {
    if (
      !window.confirm(
        `Deseja realmente excluir a turma "${turma.identificador}"?`
      )
    )
      return;
    try {
      await excluirTurma(turma.id);
      if (turmaSelecionadaId === turma.id) {
        setTurmaSelecionadaId(null);
      }
      toast.success("Turma excluída com sucesso!");
    } catch (err) {
      toast.error("Erro ao excluir a turma.");
    }
  };

  const handleExcluirMatricula = async (matricula) => {
    if (
      !window.confirm(
        `Remover a matrícula de "${matricula.aluna?.nome}" desta turma? Lançamentos financeiros desta matrícula também serão removidos.`
      )
    )
      return;
    try {
      await excluirMatricula(matricula.id);
      toast.success("Matrícula removida com sucesso!");
    } catch (err) {
      toast.error("Erro ao remover matrícula.");
    }
  };

  const handleExcluirPagamento = async (pagamentoId) => {
    if (!window.confirm("Deseja estornar/excluir este registro de pagamento?"))
      return;
    try {
      await excluirPagamento(pagamentoId);
      toast.success("Pagamento estornado com sucesso!");
    } catch (err) {
      toast.error("Erro ao estornar pagamento.");
    }
  };

  // Filtragem de Turmas
  const turmasFiltradas = turmas.filter((t) => {
    const atendeBusca =
      t.identificador?.toLowerCase().includes(busca.toLowerCase()) ||
      t.curso?.nome?.toLowerCase().includes(busca.toLowerCase());
    const atendeStatus =
      filtroStatusTurma === "todas" ? true : t.status === filtroStatusTurma;
    return atendeBusca && atendeStatus;
  });

  // Reseta paginação de turmas ao pesquisar ou mudar status
  useEffect(() => {
    setPaginaTurmas(1);
  }, [busca, filtroStatusTurma]);

  const totalPaginasTurmas = Math.max(
    1,
    Math.ceil(turmasFiltradas.length / TURMAS_POR_PAGINA)
  );

  const turmasPaginadas = useMemo(() => {
    const inicio = (paginaTurmas - 1) * TURMAS_POR_PAGINA;
    return turmasFiltradas.slice(inicio, inicio + TURMAS_POR_PAGINA);
  }, [turmasFiltradas, paginaTurmas]);

  // Intervalo de Datas para o Balanço Financeiro
  const intervaloTempo = useMemo(() => {
    const hoje = new Date();
    if (periodoFinanceiro === "mes") {
      const y = hoje.getFullYear();
      const m = String(hoje.getMonth() + 1).padStart(2, "0");
      const ultimoDia = new Date(y, hoje.getMonth() + 1, 0).getDate();
      return {
        inicio: `${y}-${m}-01`,
        fim: `${y}-${m}-${String(ultimoDia).padStart(2, "0")}`,
        rotulo: "Este Mês",
      };
    }
    if (periodoFinanceiro === "ano") {
      const y = hoje.getFullYear();
      return {
        inicio: `${y}-01-01`,
        fim: `${y}-12-31`,
        rotulo: "Este Ano",
      };
    }
    if (periodoFinanceiro === "custom") {
      return {
        inicio: dataInicioCustom || "1970-01-01",
        fim: dataFimCustom || "2099-12-31",
        rotulo: "Personalizado",
      };
    }
    return {
      inicio: "1970-01-01",
      fim: "2099-12-31",
      rotulo: "Todo o Histórico",
    };
  }, [periodoFinanceiro, dataInicioCustom, dataFimCustom]);

  // Lançamentos filtrados por período de data
  const extratoNoPeriodo = useMemo(() => {
    return (metricas.extrato || []).filter((item) => {
      if (!item.dataPagamento) return true;
      return (
        item.dataPagamento >= intervaloTempo.inicio &&
        item.dataPagamento <= intervaloTempo.fim
      );
    });
  }, [metricas.extrato, intervaloTempo]);

  // Métricas recalculadas no período selecionado
  const metricasPeriodo = useMemo(() => {
    let arrecadado = 0;
    const porForma = {};
    const alunasUnicas = new Set();

    extratoNoPeriodo.forEach((p) => {
      arrecadado += Number(p.valor) || 0;
      porForma[p.formaPagamento] =
        (porForma[p.formaPagamento] || 0) + Number(p.valor);
      if (p.alunaNome) alunasUnicas.add(p.alunaNome);
    });

    return {
      totalArrecadado: arrecadado,
      porFormaPagamento: porForma,
      totalLancamentos: extratoNoPeriodo.length,
      alunasAtivas: alunasUnicas.size,
    };
  }, [extratoNoPeriodo]);

  // Filtragem final do Extrato (período + busca textual + forma de pagamento)
  const extratoFiltrado = useMemo(() => {
    return extratoNoPeriodo.filter((item) => {
      const termo = buscaExtrato.toLowerCase().trim();
      const atendeBusca =
        !termo ||
        item.alunaNome?.toLowerCase().includes(termo) ||
        item.alunaTelefone?.toLowerCase().includes(termo) ||
        item.cursoNome?.toLowerCase().includes(termo) ||
        item.turmaIdentificador?.toLowerCase().includes(termo);

      const atendeForma =
        filtroFormaExtrato === "todas"
          ? true
          : item.formaPagamento === filtroFormaExtrato;

      return atendeBusca && atendeForma;
    });
  }, [extratoNoPeriodo, buscaExtrato, filtroFormaExtrato]);

  // Reseta para a página 1 ao alterar qualquer filtro de busca ou período
  useEffect(() => {
    setPaginaExtrato(1);
  }, [buscaExtrato, filtroFormaExtrato, periodoFinanceiro, dataInicioCustom, dataFimCustom]);

  const totalPaginasExtrato = Math.max(
    1,
    Math.ceil(extratoFiltrado.length / ITENS_POR_PAGINA_EXTRATO)
  );

  const extratoPaginado = useMemo(() => {
    const inicio = (paginaExtrato - 1) * ITENS_POR_PAGINA_EXTRATO;
    return extratoFiltrado.slice(inicio, inicio + ITENS_POR_PAGINA_EXTRATO);
  }, [extratoFiltrado, paginaExtrato]);

  // Formatação de Moeda
  const formatarMoeda = (valor) =>
    Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  // Formatação de Data
  const formatarData = (dataStr) => {
    if (!dataStr) return "-";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 max-md:p-3 min-h-[calc(100vh-3rem)] flex flex-col">
      {/* HEADER DA PÁGINA */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <GraduationCap size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                Gestão de Cursos & Turmas
              </h2>
              <p className="text-slate-500 text-sm">
                Controle de turmas, matrículas e financeiro exclusivo de cursos (isolado do caixa do salão)
              </p>
            </div>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex items-center gap-2.5 flex-wrap max-md:w-full">
          <button
            onClick={() => {
              setCursoEditando(null);
              setModalCursoAberto(true);
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition flex items-center gap-1.5 max-md:flex-1 justify-center"
          >
            <Plus size={16} />
            Novo Curso Base
          </button>

          <button
            onClick={() => {
              if (cursos.length === 0) {
                toast.error("Cadastre primeiro um Curso Base antes de abrir uma turma.");
                setModalCursoAberto(true);
                return;
              }
              setTurmaEditando(null);
              setModalTurmaAberto(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-600/20 transition flex items-center gap-1.5 max-md:flex-1 justify-center"
          >
            <Calendar size={16} />
            Abrir Nova Turma
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO POR ABAS SUPERIORES */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200/80">
        <button
          onClick={() => {
            setAbaAtiva("turmas");
            setTurmaSelecionadaId(null);
          }}
          className={`pb-3 px-4 text-sm font-bold transition relative flex items-center gap-2 ${
            abaAtiva === "turmas" && !turmaSelecionadaId
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Calendar size={18} />
          Turmas Abertas & Histórico
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-bold">
            {turmas.length}
          </span>
        </button>

        <button
          onClick={() => {
            setAbaAtiva("catalogo");
            setTurmaSelecionadaId(null);
          }}
          className={`pb-3 px-4 text-sm font-bold transition relative flex items-center gap-2 ${
            abaAtiva === "catalogo"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <GraduationCap size={18} />
          Catálogo de Cursos Base
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-bold">
            {cursos.length}
          </span>
        </button>

        <button
          onClick={() => {
            setAbaAtiva("financeiro");
            setTurmaSelecionadaId(null);
          }}
          className={`pb-3 px-4 text-sm font-bold transition relative flex items-center gap-2 ${
            abaAtiva === "financeiro"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <DollarSign size={18} />
          Balanço Financeiro de Cursos
        </button>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col">
        {/* ================================================================= */}
        {/* VISÃO 1: DETALHES DE UMA TURMA ESPECÍFICA                         */}
        {/* ================================================================= */}
        {turmaSelecionadaId && turmaAtiva ? (
          <div className="space-y-6 animate-fade-in">
            {/* Header com Voltar */}
            <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
              <button
                onClick={() => setTurmaSelecionadaId(null)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700 transition"
              >
                <ChevronLeft size={18} />
                Voltar para todas as turmas
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTurmaEditando(turmaAtiva);
                    setModalTurmaAberto(true);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition flex items-center gap-1"
                >
                  <Edit2 size={13} />
                  Editar Turma / Vagas
                </button>
                <button
                  onClick={() => handleExcluirTurma(turmaAtiva)}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  Excluir Turma
                </button>
              </div>
            </div>

            {/* Painel Informativo da Turma */}
            <div className="bg-gradient-to-br from-purple-50/50 to-slate-50 p-5 rounded-2xl border border-purple-100">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-100/70 px-2.5 py-1 rounded-md">
                    {turmaAtiva.curso?.nome}
                  </span>
                  <h3 className="text-xl font-bold text-slate-800 mt-2">
                    {turmaAtiva.identificador}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      Início: {formatarData(turmaAtiva.data_inicio)}
                      {turmaAtiva.data_fim && ` até ${formatarData(turmaAtiva.data_fim)}`}
                    </span>
                    {turmaAtiva.horario && (
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {turmaAtiva.horario}
                      </span>
                    )}
                    {turmaAtiva.instrutor && (
                      <span className="flex items-center gap-1">
                        <User size={13} />
                        Instrutor(a): {turmaAtiva.instrutor.nome}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right max-md:text-left">
                  <span className="text-xs text-slate-500 block">Valor por Aluna</span>
                  <span className="text-2xl font-black text-slate-800">
                    {formatarMoeda(turmaAtiva.valor_turma)}
                  </span>
                </div>
              </div>

              {/* CARDS DE RESUMO FINANCEIRO E OCUPAÇÃO DA TURMA */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-purple-100/70">
                {/* Vagas */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span>Ocupação de Vagas</span>
                    <Users size={14} className="text-purple-500" />
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {turmaAtiva.matriculas?.length || 0} / {turmaAtiva.vagas_totais}
                    <span className="text-xs font-normal text-slate-400 ml-1">
                      (
                      {Math.round(
                        ((turmaAtiva.matriculas?.length || 0) /
                          Math.max(1, turmaAtiva.vagas_totais)) *
                          100
                      )}
                      %)
                    </span>
                  </div>
                  {turmaAtiva.matriculas?.length >= turmaAtiva.vagas_totais && (
                    <span className="text-[10px] font-bold text-amber-600 block mt-0.5">
                      Vagas cheias (você pode expandir em Editar)
                    </span>
                  )}
                </div>

                {/* Faturamento Previsto */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span>Total Previsto</span>
                    <TrendingUp size={14} className="text-slate-400" />
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {formatarMoeda(
                      (turmaAtiva.matriculas || []).reduce(
                        (acc, m) => acc + (Number(m.valor_acordado) || 0),
                        0
                      )
                    )}
                  </div>
                </div>

                {/* Já Arrecadado */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between text-emerald-600 text-xs mb-1">
                    <span>Já no Bolso (Recebido)</span>
                    <DollarSign size={14} className="text-emerald-500" />
                  </div>
                  <div className="text-lg font-bold text-emerald-600">
                    {formatarMoeda(
                      (turmaAtiva.matriculas || []).reduce(
                        (acc, m) => acc + (Number(m.totalPago) || 0),
                        0
                      )
                    )}
                  </div>
                </div>

                {/* Pendente */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between text-amber-600 text-xs mb-1">
                    <span>A Receber até a Data</span>
                    <AlertCircle size={14} className="text-amber-500" />
                  </div>
                  <div className="text-lg font-bold text-amber-600">
                    {formatarMoeda(
                      (turmaAtiva.matriculas || []).reduce(
                        (acc, m) => acc + (Number(m.saldoDevedor) || 0),
                        0
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* LISTA DE ALUNAS MATRICULADAS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Users size={18} className="text-purple-600" />
                  Alunas Matriculadas ({turmaAtiva.matriculas?.length || 0})
                </h4>

                <button
                  onClick={() => setModalMatriculaAberto(true)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                >
                  <UserPlus size={14} />
                  Matricular Aluna
                </button>
              </div>

              {turmaAtiva.matriculas?.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Users size={36} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">
                    Nenhuma aluna matriculada nesta turma ainda.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Clique em "Matricular Aluna" para adicionar uma cliente existente ou cadastrar uma nova aluna.
                  </p>
                  <button
                    onClick={() => setModalMatriculaAberto(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition"
                  >
                    Matricular Primeira Aluna
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-sm">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                        <th className="py-3 px-4">Aluna</th>
                        <th className="py-3 px-4">Telefone</th>
                        <th className="py-3 px-4">Valor Curso</th>
                        <th className="py-3 px-4">Pago</th>
                        <th className="py-3 px-4">Saldo Pendente</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {turmaAtiva.matriculas.map((mat) => {
                        const quitado = mat.saldoDevedor <= 0;
                        const temSinal = mat.totalPago > 0 && !quitado;

                        return (
                          <tr key={mat.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-4 font-semibold text-slate-800">
                              {mat.aluna?.nome || "Aluna sem nome"}
                              {mat.observacoes && (
                                <span className="block text-[11px] text-slate-400 font-normal">
                                  {mat.observacoes}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 text-xs">
                              {mat.aluna?.telefone || "-"}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-700">
                              {formatarMoeda(mat.valor_acordado)}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-emerald-600">
                              {formatarMoeda(mat.totalPago)}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-amber-600">
                              {formatarMoeda(mat.saldoDevedor)}
                            </td>
                            <td className="py-3.5 px-4">
                              {quitado ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                  <CheckCircle2 size={12} />
                                  Quitado
                                </span>
                              ) : temSinal ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                  <AlertCircle size={12} />
                                  Sinal Pago
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                                  <AlertCircle size={12} />
                                  Pendente
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!quitado && (
                                  <button
                                    onClick={() => {
                                      setMatriculaParaPagamento(mat);
                                      setModalPagamentoAberto(true);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition flex items-center gap-1"
                                    title="Lançar recebimento restante"
                                  >
                                    <DollarSign size={13} />
                                    Lançar Pagamento
                                  </button>
                                )}

                                <button
                                  onClick={() => handleExcluirMatricula(mat)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title="Remover matrícula"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* ================================================================= */}
        {/* VISÃO 2: LISTA DE TURMAS                                          */}
        {/* ================================================================= */}
        {abaAtiva === "turmas" && !turmaSelecionadaId && (
          <div className="space-y-4 flex-1 flex flex-col">
            {/* Barra de Filtros e Busca */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[240px]">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por identificador ou curso..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filtroStatusTurma}
                  onChange={(e) => setFiltroStatusTurma(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-700"
                >
                  <option value="todas">Todos os Status</option>
                  <option value="aberta">Abertas</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluida">Concluídas</option>
                  <option value="cancelada">Canceladas</option>
                </select>
              </div>
            </div>

            {/* Listagem em Cards de Turmas */}
            {turmasFiltradas.length === 0 ? (
              <div className="text-center py-16 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 flex-1 flex flex-col items-center justify-center">
                <Calendar size={40} className="text-slate-300 mb-2" />
                <h4 className="text-base font-bold text-slate-700">
                  Nenhuma turma encontrada
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Abra uma nova turma com datas específicas para matricular alunas e controlar o faturamento exclusivo.
                </p>
                <button
                  onClick={() => {
                    if (cursos.length === 0) {
                      toast.error("Crie primeiro um Curso Base no catálogo.");
                      setModalCursoAberto(true);
                      return;
                    }
                    setTurmaEditando(null);
                    setModalTurmaAberto(true);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition"
                >
                  Abrir Primeira Turma
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {turmasPaginadas.map((turma) => {
                    const percentual = Math.round(
                      ((turma.totalMatriculas || 0) / Math.max(1, turma.vagas_totais)) * 100
                    );

                    return (
                      <div
                        key={turma.id}
                        onClick={() => setTurmaSelecionadaId(turma.id)}
                        className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/5 transition cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          {/* Status Tag */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                              {turma.curso?.nome}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                turma.status === "aberta"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : turma.status === "em_andamento"
                                  ? "bg-blue-100 text-blue-700"
                                  : turma.status === "concluida"
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {turma.status}
                            </span>
                          </div>

                          {/* Título da Turma */}
                          <h4 className="text-base font-bold text-slate-800 group-hover:text-purple-600 transition">
                            {turma.identificador}
                          </h4>

                          {/* Metadados */}
                          <div className="mt-2 space-y-1 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-slate-400" />
                              <span>Início: {formatarData(turma.data_inicio)}</span>
                            </div>
                            {turma.instrutor && (
                              <div className="flex items-center gap-1.5">
                                <User size={13} className="text-slate-400" />
                                <span>{turma.instrutor.nome}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Barra de Vagas e Valores */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          {/* Vagas */}
                          <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>Vagas Ocupadas</span>
                            <span className="font-bold">
                              {turma.totalMatriculas} / {turma.vagas_totais}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                percentual >= 100 ? "bg-emerald-500" : "bg-purple-600"
                              }`}
                              style={{ width: `${Math.min(100, percentual)}%` }}
                            />
                          </div>

                          {/* Valores Financeiros */}
                          <div className="flex justify-between items-center mt-3 pt-2 text-xs">
                            <div>
                              <span className="text-[11px] text-slate-400 block">Recebido</span>
                              <span className="font-bold text-emerald-600">
                                {formatarMoeda(turma.totalArrecadado)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] text-slate-400 block">Pendente</span>
                              <span className="font-bold text-amber-600">
                                {formatarMoeda(turma.totalPendente)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 pt-2 flex items-center justify-between text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-transform">
                            <span>Gerenciar Alunas & Caixa</span>
                            <ChevronRight size={15} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {turmasFiltradas.length > TURMAS_POR_PAGINA && (
                  <div className="pt-2 border-t border-slate-100">
                    <Pagination
                      paginaAtual={paginaTurmas}
                      setPaginaAtual={setPaginaTurmas}
                      totalPaginas={totalPaginasTurmas}
                      totalItems={turmasFiltradas.length}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* VISÃO 3: CATÁLOGO DE CURSOS BASE                                  */}
        {/* ================================================================= */}
        {abaAtiva === "catalogo" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Cursos Cadastrados ({cursos.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Modelos de cursos reutilizáveis para abrir múltiplas turmas ao longo do ano
                </p>
              </div>
            </div>

            {cursos.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <GraduationCap size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">
                  Nenhum curso cadastrado ainda.
                </p>
                <button
                  onClick={() => {
                    setCursoEditando(null);
                    setModalCursoAberto(true);
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition"
                >
                  Cadastrar Primeiro Curso
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cursos.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-base font-bold text-slate-800">{c.nome}</h4>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setCursoEditando(c);
                              setModalCursoAberto(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleExcluirCurso(c)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {c.descricao && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-3">
                          {c.descricao}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Carga Horária</span>
                        <span className="font-semibold text-slate-700">
                          {c.carga_horaria || "-"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Preço Base</span>
                        <span className="font-bold text-slate-800">
                          {formatarMoeda(c.valor_padrao)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* VISÃO 4: BALANÇO FINANCEIRO EXCLUSIVO DE CURSOS                    */}
        {/* ================================================================= */}
        {abaAtiva === "financeiro" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Balanço Financeiro Global de Cursos
                </h3>
                <p className="text-xs text-slate-500">
                  Valores isolados da operação do salão (não misturam com corte, manicure ou produtos)
                </p>
              </div>

              {/* Controles de Filtro de Período */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPeriodoFinanceiro("mes")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      periodoFinanceiro === "mes"
                        ? "bg-white text-purple-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Este Mês
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodoFinanceiro("ano")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      periodoFinanceiro === "ano"
                        ? "bg-white text-purple-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Este Ano
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodoFinanceiro("todos")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      periodoFinanceiro === "todos"
                        ? "bg-white text-purple-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Todo o Histórico
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodoFinanceiro("custom")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      periodoFinanceiro === "custom"
                        ? "bg-white text-purple-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Personalizado
                  </button>
                </div>

                {periodoFinanceiro === "custom" && (
                  <div className="flex items-center gap-1.5 animate-fade-in text-xs">
                    <input
                      type="date"
                      value={dataInicioCustom}
                      onChange={(e) => setDataInicioCustom(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-slate-400">até</span>
                    <input
                      type="date"
                      value={dataFimCustom}
                      onChange={(e) => setDataFimCustom(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Cards de Métricas do Período */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  Alunas com Recebimento no Período
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-800">
                    {metricasPeriodo.alunasAtivas}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({metricas.totalAlunas} total geral)
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  Faturamento Previsto Total
                </span>
                <span className="text-2xl font-black text-slate-800">
                  {formatarMoeda(metricas.totalPrevisto)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Soma de todas as turmas
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
                <span className="text-xs font-semibold text-emerald-700 block mb-1">
                  Arrecadado ({intervaloTempo.rotulo})
                </span>
                <span className="text-2xl font-black text-emerald-600">
                  {formatarMoeda(metricasPeriodo.totalArrecadado)}
                </span>
                <span className="text-[11px] text-emerald-700/70 block mt-0.5">
                  {metricasPeriodo.totalLancamentos} pagamento(s) no período
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-sm">
                <span className="text-xs font-semibold text-amber-700 block mb-1">
                  Total a Receber (Pendente Geral)
                </span>
                <span className="text-2xl font-black text-amber-600">
                  {formatarMoeda(metricas.totalPendente)}
                </span>
                <span className="text-[11px] text-amber-700/70 block mt-0.5">
                  Saldo para quitar turmas
                </span>
              </div>
            </div>

            {/* Distribuição por Forma de Pagamento no Período */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Receipt size={16} className="text-purple-600" />
                  Recebimentos por Forma de Pagamento ({intervaloTempo.rotulo})
                </h4>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Total: {formatarMoeda(metricasPeriodo.totalArrecadado)}
                </span>
              </div>

              {Object.keys(metricasPeriodo.porFormaPagamento || {}).length === 0 ? (
                <p className="text-xs text-slate-400">
                  Nenhum recebimento registrado neste período ({intervaloTempo.rotulo}).
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(metricasPeriodo.porFormaPagamento).map(([forma, total]) => (
                    <div
                      key={forma}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <span className="text-xs text-slate-500 block">{forma}</span>
                      <span className="text-lg font-bold text-slate-800 mt-1 block">
                        {formatarMoeda(total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* EXTRATO DETALHADO DE RECEBIMENTOS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <DollarSign size={18} className="text-emerald-600" />
                    Extrato Detalhado de Recebimentos ({extratoFiltrado.length})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Histórico completo de aluna, curso, turma e forma de recebimento
                  </p>
                </div>

                {/* Filtros do Extrato */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="relative min-w-[200px]">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={buscaExtrato}
                      onChange={(e) => setBuscaExtrato(e.target.value)}
                      placeholder="Buscar por aluna, curso ou turma..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <select
                    value={filtroFormaExtrato}
                    onChange={(e) => setFiltroFormaExtrato(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="todas">Todas as Formas</option>
                    <option value="Pix">Pix</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>

              {extratoFiltrado.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400">
                    Nenhum lançamento financeiro encontrado no extrato.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                          <th className="py-2.5 px-3">Data</th>
                          <th className="py-2.5 px-3">Aluna</th>
                          <th className="py-2.5 px-3">Curso & Turma</th>
                          <th className="py-2.5 px-3">Tipo</th>
                          <th className="py-2.5 px-3">Forma</th>
                          <th className="py-2.5 px-3 text-right">Valor Recebido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {extratoPaginado.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-2.5 px-3 font-medium text-slate-600 whitespace-nowrap">
                              {formatarData(item.dataPagamento)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-800 block">
                                {item.alunaNome}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {item.alunaTelefone}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-purple-700 block">
                                {item.cursoNome}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.turmaId) {
                                    setTurmaSelecionadaId(item.turmaId);
                                    setAbaAtiva("turmas");
                                  }
                                }}
                                className="text-[11px] text-slate-500 hover:text-purple-600 hover:underline flex items-center gap-1"
                                title="Ver detalhes desta turma"
                              >
                                <span>{item.turmaIdentificador}</span>
                                <ChevronRight size={11} />
                              </button>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.tipoLancamento === "sinal"
                                    ? "bg-amber-100 text-amber-800"
                                    : item.tipoLancamento === "restante"
                                    ? "bg-blue-100 text-blue-800"
                                    : item.tipoLancamento === "integral"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {item.tipoLancamento === "sinal"
                                  ? "Sinal (Entrada)"
                                  : item.tipoLancamento === "restante"
                                  ? "Quitação Restante"
                                  : item.tipoLancamento === "integral"
                                  ? "Valor Integral"
                                  : "Parcela Avulsa"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                {item.formaPagamento}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-600 text-sm whitespace-nowrap">
                              {formatarMoeda(item.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {extratoFiltrado.length > ITENS_POR_PAGINA_EXTRATO && (
                    <div className="pt-2 border-t border-slate-100">
                      <Pagination
                        paginaAtual={paginaExtrato}
                        setPaginaAtual={setPaginaExtrato}
                        totalPaginas={totalPaginasExtrato}
                        totalItems={extratoFiltrado.length}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAIS */}
      <ModalCurso
        isOpen={modalCursoAberto}
        onClose={() => setModalCursoAberto(false)}
        curso={cursoEditando}
        onSalvar={
          cursoEditando
            ? (p) => atualizarCurso({ id: cursoEditando.id, payload: p })
            : (p) => criarCurso({ ...p, tenant_id: tenantId })
        }
        isSalvando={isSalvando}
      />

      <ModalTurma
        isOpen={modalTurmaAberto}
        onClose={() => setModalTurmaAberto(false)}
        turma={turmaEditando}
        cursos={cursos}
        instrutores={instrutores}
        onSalvar={
          turmaEditando
            ? (p) => atualizarTurma({ id: turmaEditando.id, payload: p })
            : (p) => criarTurma({ ...p, tenant_id: tenantId })
        }
        isSalvando={isSalvando}
      />

      <ModalMatricula
        isOpen={modalMatriculaAberto}
        onClose={() => setModalMatriculaAberto(false)}
        turma={turmaAtiva}
        onMatricular={matricularAluna}
        isSalvando={isSalvandoTurma}
        tenantId={tenantId}
      />

      <ModalPagamentoCurso
        isOpen={modalPagamentoAberto}
        onClose={() => {
          setModalPagamentoAberto(false);
          setMatriculaParaPagamento(null);
        }}
        matricula={matriculaParaPagamento}
        turma={turmaAtiva}
        onRegistrarPagamento={registrarPagamento}
        isSalvando={isSalvandoTurma}
        tenantId={tenantId}
      />
    </div>
  );
}

export default Cursos;

