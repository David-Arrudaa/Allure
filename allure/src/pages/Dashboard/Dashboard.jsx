import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  AlertCircle,
  X,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import { toast } from "../../lib/toast";
import { Skeleton } from "../../components/ui/Skeleton";
import { ModalPagamento } from "../../components/domain/ModalPagamento/ModalPagamento";

export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const hojeFormatoInput = new Date().toISOString().split("T")[0];

  const [filtroPeriodo, setFiltroPeriodo] = useState("mes");
  const [dataCustomInicio, setDataCustomInicio] = useState(hojeFormatoInput);
  const [dataCustomFim, setDataCustomFim] = useState(hojeFormatoInput);

  const [isModalPendentesAberto, setIsModalPendentesAberto] = useState(false);
  const [isModalPagamentoAberto, setIsModalPagamentoAberto] = useState(false);
  const [agendamentoParaPagamento, setAgendamentoParaPagamento] = useState(null);

  // Computa o intervalo de datas do filtro de forma pura
  const { dataInicio, dataFim, inicioHojeStr } = useMemo(() => {
    const hoje = new Date();
    const iniHoje = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
    ).toISOString();
    const fimHoje = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
      23,
      59,
      59,
    ).toISOString();

    let dInicio, dFim;

    if (filtroPeriodo === "hoje") {
      dInicio = iniHoje;
      dFim = fimHoje;
    } else if (filtroPeriodo === "semana") {
      const diaSemana = hoje.getDay();
      const dataDomingo = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate() - diaSemana,
      );
      const dataSabado = new Date(
        dataDomingo.getFullYear(),
        dataDomingo.getMonth(),
        dataDomingo.getDate() + 6,
      );
      dInicio = new Date(
        dataDomingo.getFullYear(),
        dataDomingo.getMonth(),
        dataDomingo.getDate(),
        0,
        0,
        0,
      ).toISOString();
      dFim = new Date(
        dataSabado.getFullYear(),
        dataSabado.getMonth(),
        dataSabado.getDate(),
        23,
        59,
        59,
      ).toISOString();
    } else if (filtroPeriodo === "mes") {
      dInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
      dFim = new Date(
        hoje.getFullYear(),
        hoje.getMonth() + 1,
        0,
        23,
        59,
        59,
      ).toISOString();
    } else if (filtroPeriodo === "personalizado") {
      if (dataCustomInicio && dataCustomFim) {
        const [anoI, mesI, diaI] = dataCustomInicio.split("-");
        const [anoF, mesF, diaF] = dataCustomFim.split("-");
        dInicio = new Date(anoI, mesI - 1, diaI, 0, 0, 0).toISOString();
        dFim = new Date(anoF, mesF - 1, diaF, 23, 59, 59).toISOString();
      }
    }

    return { dataInicio: dInicio, dataFim: dFim, inicioHojeStr: iniHoje };
  }, [filtroPeriodo, dataCustomInicio, dataCustomFim]);

  const profissionalIdFiltro = !profile?.is_admin ? profile?.id : null;

  const {
    metricas,
    rankingProfissionais,
    rankingServicos,
    listaPendentes,
    isLoading: loading,
    baixarPagamento,
  } = useDashboard({
    dataInicio,
    dataFim,
    inicioHojeStr,
    profissionalId: profissionalIdFiltro,
  });

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor || 0);
  };

  const labelPeriodo =
    filtroPeriodo === "hoje"
      ? "HOJE"
      : filtroPeriodo === "semana"
        ? "NA SEMANA"
        : filtroPeriodo === "mes"
          ? "NO MÊS"
          : "PERÍODO SELECIONADO";

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 max-md:p-3.5 min-h-[calc(100vh-3rem)] max-md:min-h-auto text-[var(--cor-texto)] flex flex-col">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-100 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h2 className="text-[1.6rem] font-bold text-[var(--cor-texto)] tracking-tight mb-1 max-md:text-[1.35rem]">
            Painel
          </h2>
          <p className="text-slate-500 text-[0.95rem]">
            Acompanhe a saúde do seu negócio em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap max-md:w-full max-md:flex-col max-md:items-stretch">
          {/* Filtros de período */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg max-md:flex-wrap max-md:w-full">
            {["hoje", "semana", "mes", "personalizado"].map((chave) => {
              const ativo = filtroPeriodo === chave;
              const rotulos = {
                hoje: "Hoje",
                semana: "Semana",
                mes: "Mês",
                personalizado: "Personalizado",
              };
              return (
                <button
                  key={chave}
                  onClick={() => setFiltroPeriodo(chave)}
                  className={`border-none py-1.5 px-3 rounded-md text-[0.85rem] font-semibold cursor-pointer transition-all ${
                    ativo
                      ? "bg-white text-[var(--cor-primaria)] shadow-sm"
                      : "bg-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {rotulos[chave]}
                </button>
              );
            })}
          </div>

          {filtroPeriodo === "personalizado" && (
            <div className="flex items-center gap-2 bg-white py-2 px-2.5 rounded-lg border border-slate-200">
              <input
                type="date"
                value={dataCustomInicio}
                onChange={(e) => setDataCustomInicio(e.target.value)}
                className="border border-slate-300 rounded-md py-1 px-2 text-[0.85rem] text-slate-600 outline-none focus:border-[var(--cor-primaria)]"
              />
              <span className="text-[0.85rem] text-slate-500 font-semibold">
                até
              </span>
              <input
                type="date"
                value={dataCustomFim}
                onChange={(e) => setDataCustomFim(e.target.value)}
                className="border border-slate-300 rounded-md py-1 px-2 text-[0.85rem] text-slate-600 outline-none focus:border-[var(--cor-primaria)]"
              />
            </div>
          )}

          <button
            className="btn-acao-primaria max-md:w-full max-md:justify-center"
            onClick={() => navigate("/agenda")}
          >
            <Plus size={18} />
            <span>Ir para Agenda</span>
          </button>
        </div>
      </div>

      {/* Alerta de pagamentos em atraso */}
      {!loading && metricas.pendentesQtd > 0 && (
        <div
          onClick={() => setIsModalPendentesAberto(true)}
          className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center gap-3 mb-6 cursor-pointer transition-colors hover:bg-red-100"
        >
          <AlertCircle className="text-red-500 shrink-0" size={24} />
          <div className="flex-1">
            <h4 className="m-0 text-red-900 text-[0.95rem] font-bold">
              Pagamentos em Atraso
            </h4>
            <p className="m-0 mt-1 text-red-700 text-[0.85rem]">
              Existem{" "}
              <strong>
                {metricas.pendentesQtd} atendimentos de dias anteriores
              </strong>{" "}
              sem recebimento. Clique aqui para visualizar e dar baixa (
              <strong>{formatarMoeda(metricas.pendentesValor)}</strong>).
            </p>
          </div>
          <ArrowUpRight className="text-red-500 shrink-0" size={20} />
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 mb-6 max-md:grid-cols-1">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:border-[var(--cor-primaria)] max-md:py-4 max-md:px-5">
          <div>
            <span className="text-xs font-bold text-slate-500 tracking-wider">
              ATENDIMENTOS ({labelPeriodo})
            </span>
            <h2 className="text-[1.5rem] font-bold text-[var(--cor-texto)] mt-1 max-md:text-xl">
              {loading ? (
                <Skeleton width="80px" height="36px" />
              ) : (
                metricas.totalAtendimentos
              )}
            </h2>
          </div>
          <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center bg-blue-100 text-blue-700 shrink-0">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:border-[var(--cor-primaria)] max-md:py-4 max-md:px-5">
          <div>
            <span className="text-xs font-bold text-slate-500 tracking-wider">
              FATURAMENTO ({labelPeriodo})
            </span>
            <h2 className="text-[1.5rem] font-bold text-[var(--cor-texto)] mt-1 max-md:text-xl">
              {loading ? (
                <Skeleton width="140px" height="36px" />
              ) : (
                formatarMoeda(metricas.faturamento)
              )}
            </h2>
          </div>
          <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center bg-emerald-100 text-emerald-700 shrink-0">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:border-[var(--cor-primaria)] max-md:py-4 max-md:px-5">
          <div>
            <span className="text-xs font-bold text-slate-500 tracking-wider">
              TICKET MÉDIO
            </span>
            <h2 className="text-[1.5rem] font-bold text-[var(--cor-texto)] mt-1 max-md:text-xl">
              {loading ? (
                <Skeleton width="100px" height="36px" />
              ) : (
                formatarMoeda(metricas.ticketMedio)
              )}
            </h2>
          </div>
          <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center bg-purple-100 text-purple-700 shrink-0">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5 mb-6 max-md:grid-cols-1">
        <div
          className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-all shadow-sm hover:border-[var(--cor-primaria)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(124,58,237,0.1)] hover:bg-purple-50/30"
          onClick={() => navigate("/agenda")}
        >
          <div className="w-11 h-11 rounded-lg bg-[rgba(124,58,237,0.12)] text-[var(--cor-primaria)] flex items-center justify-center shrink-0">
            <Plus size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-[var(--cor-texto)] mb-0.5">
              Novo Agendamento
            </h3>
            <p className="text-sm text-slate-500 m-0">Marcar horário na agenda</p>
          </div>
          <ArrowUpRight size={20} className="text-[var(--cor-primaria)] shrink-0" />
        </div>

        <div
          className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-all shadow-sm hover:border-[var(--cor-primaria)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(124,58,237,0.1)] hover:bg-purple-50/30"
          onClick={() => navigate("/clientes")}
        >
          <div className="w-11 h-11 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-[var(--cor-texto)] mb-0.5">
              Cadastrar Cliente
            </h3>
            <p className="text-sm text-slate-500 m-0">Adicionar nova cliente à base</p>
          </div>
          <ArrowUpRight size={20} className="text-[var(--cor-primaria)] shrink-0" />
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5 max-md:grid-cols-1">
        {/* Ranking Funcionárias */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 text-[var(--cor-primaria)] border-b-2 border-purple-50 pb-2">
            <Users size={20} />
            <h3 className="text-[1.05rem] font-bold m-0 text-[var(--cor-texto)]">
              Atendimentos por Funcionária (Pagos)
            </h3>
          </div>
          <div className="flex flex-col">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} width="100%" height="56px" borderRadius="10px" />
                ))}
              </div>
            ) : rankingProfissionais.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">
                Nenhum atendimento pago encontrado.
              </p>
            ) : (
              rankingProfissionais.map((prof) => (
                <div
                  key={prof.nome}
                  className="flex items-center justify-between py-3 px-1 border-b border-slate-100 last:border-none"
                >
                  <div className="flex flex-col">
                    <strong className="text-[0.92rem] text-[var(--cor-texto)]">
                      {prof.nome}
                    </strong>
                    <span className="text-xs text-slate-500 mt-0.5">
                      {prof.qtd} atendimentos pagos
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ranking Serviços */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 text-[var(--cor-primaria)] border-b-2 border-purple-50 pb-2">
            <TrendingUp size={20} />
            <h3 className="text-[1.05rem] font-bold m-0 text-[var(--cor-texto)]">
              Serviços Mais Procurados
            </h3>
          </div>
          <div className="flex flex-col">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} width="100%" height="56px" borderRadius="10px" />
                ))}
              </div>
            ) : rankingServicos.length === 0 ? (
              <p className="text-slate-500 text-sm py-4 text-center">
                Nenhum serviço pago registrado.
              </p>
            ) : (
              rankingServicos.map((serv) => (
                <div
                  key={serv.nome}
                  className="flex items-center justify-between py-3 px-1 border-b border-slate-100 last:border-none"
                >
                  <div className="flex flex-col">
                    <strong className="text-[0.92rem] text-[var(--cor-texto)]">
                      {serv.nome}
                    </strong>
                    <span className="text-xs text-slate-500 mt-0.5">
                      {serv.porcentagem}% da preferência
                    </span>
                  </div>
                  <div className="font-bold text-[0.95rem] text-[var(--cor-primaria)]">
                    {formatarMoeda(serv.valorTotal)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Baixa de Atrasados */}
      {isModalPendentesAberto && (
        <div
          className="modal-overlay"
          onClick={() => setIsModalPendentesAberto(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-[600px] p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1)] animate-[modalAparecer_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-100 rounded-lg text-red-500">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h2 className="m-0 text-xl font-bold text-slate-800">
                    Pagamentos em Atraso
                  </h2>
                  <p className="m-0 mt-0.5 text-xs text-slate-500">
                    Dê baixa nos valores que já foram acertados para atualizar o caixa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-fechar"
                onClick={() => setIsModalPendentesAberto(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto pr-2 flex flex-col gap-2.5">
              {listaPendentes.map((ag) => {
                const dataObj = new Date(ag.data_horario);
                const dataFormatada = `${String(dataObj.getDate()).padStart(2, "0")}/${String(dataObj.getMonth() + 1).padStart(2, "0")}`;

                return (
                  <div
                    key={ag.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">
                          {ag.customers?.nome || (ag.customer_id ? "—" : "Venda Balcão")}
                        </span>
                        <span className="text-xs bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full font-semibold">
                          {dataFormatada}
                        </span>
                      </div>
                      <div className="text-sm text-slate-500">{ag.servico}</div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-red-500 text-lg">
                        {formatarMoeda(ag.valor)}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setAgendamentoParaPagamento({
                            id: ag.id,
                            cliente: ag.customers?.nome,
                            valor: ag.valor,
                          });
                          setIsModalPagamentoAberto(true);
                        }}
                        className="flex items-center gap-1.5 bg-green-500 text-white border-none py-2 px-4 rounded-lg font-semibold cursor-pointer transition-colors hover:bg-green-600"
                      >
                        <CheckCircle2 size={18} />
                        Dar Baixa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pagamento */}
      <ModalPagamento
        isOpen={isModalPagamentoAberto}
        onClose={() => setIsModalPagamentoAberto(false)}
        dados={agendamentoParaPagamento}
        onSave={async (pacotePagamento) => {
          if (agendamentoParaPagamento) {
            try {
              await baixarPagamento({
                appointmentId: agendamentoParaPagamento.id,
                tenantId: profile?.tenant_id,
                metodoPagamento: pacotePagamento.metodoPagamento,
                valor: agendamentoParaPagamento.valor,
              });

              toast.success("Pagamento registrado com sucesso!");
              setIsModalPagamentoAberto(false);

              if (listaPendentes.length === 1) {
                setIsModalPendentesAberto(false);
              }
            } catch (error) {
              console.error("Erro ao registrar pagamento:", error.message);
              toast.error("Erro ao registrar pagamento: " + (error.message || ""));
            }
          }
        }}
      />
    </div>
  );
}
