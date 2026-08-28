import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  DollarSign,
  Calendar,
  CreditCard,
  Wallet,
  QrCode,
  User,
  X,
  ChevronDown,
  ChevronUp,
  Percent,
} from "lucide-react";
import { supabase } from "../../services/supabase";
import { Skeleton } from "../../components/ui/Skeleton";
import { Pagination } from "../../components/ui/Pagination";
import { ModalRecebimentoAvulso } from "../../components/domain/ModalRecebimentoAvulso";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../../components/ui/Button";
import "./Financeiro.css";

export function Financeiro() {
  const { profile } = useAuth();
  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const dataAtual = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(
    meses[dataAtual.getMonth()],
  );
  const [anoSelecionado, setAnoSelecionado] = useState(
    dataAtual.getFullYear().toString(),
  );
  const [busca, setBusca] = useState("");
  const [filtroFuncionariaGeral, setFiltroFuncionariaGeral] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [isModalAvulsoOpen, setIsModalAvulsoOpen] = useState(false);

  // ESTADOS DE PAGINAÇÃO (Limite de 20)
  const [paginaGeral, setPaginaGeral] = useState(1);
  const [paginaProf, setPaginaProf] = useState(1);
  const itensPorPagina = 20;

  // Estados dos dados gerais
  const [metricas, setMetricas] = useState({
    total: 0,
    pix: 0,
    dinheiro: 0,
    cartao: 0,
  });
  const [historicoPagamentos, setHistoricoPagamentos] = useState([]);

  // Estados exclusivos do Desempenho (Equipe)
  const [filtroDesempenho, setFiltroDesempenho] = useState("mes"); // "mes" ou "semana"
  const [funcionarias, setFuncionarias] = useState([]);
  const [atendimentosPorProfissional, setAtendimentosPorProfissional] =
    useState({});
  const [loadingEquipe, setLoadingEquipe] = useState(false);

  // Controles de interface
  const [expandirDesempenho, setExpandirDesempenho] = useState(false);
  const [expandirHistorico, setExpandirHistorico] = useState(true);
  const [profSelecionada, setProfSelecionada] = useState(null);

  useEffect(() => {
    setPaginaGeral(1);
    carregarMetricasGerais();
  }, [mesSelecionado, anoSelecionado, busca, filtroFuncionariaGeral]);

  useEffect(() => {
    setProfSelecionada(null);
    carregarDesempenhoEquipe();
  }, [mesSelecionado, anoSelecionado, filtroDesempenho, busca]);

  useEffect(() => {
    setPaginaProf(1);
  }, [profSelecionada]);

  // 1. CARREGA O FATURAMENTO E HISTÓRICO GERAL
  const carregarMetricasGerais = async () => {
    try {
      setLoading(true);
      const anoNum = Number(anoSelecionado);
      let inicioFiltro, fimFiltro;

      if (mesSelecionado === "Ano") {
        inicioFiltro = `${anoNum}-01-01T00:00:00`;
        fimFiltro = `${anoNum}-12-31T23:59:59`;
      } else {
        const mesIndex = meses.indexOf(mesSelecionado);
        const mesFormatado = String(mesIndex + 1).padStart(2, "0");
        const ultimoDiaMes = new Date(anoNum, mesIndex + 1, 0).getDate();
        inicioFiltro = `${anoNum}-${mesFormatado}-01T00:00:00`;
        fimFiltro = `${anoNum}-${mesFormatado}-${String(ultimoDiaMes).padStart(2, "0")}T23:59:59`;
      }

      let queryGeral = supabase
        .from("appointments")
        .select(
          `id, valor, servico, data_horario, forma_pagamento, customers ( nome ), profissionais ( id, nome )`,
        )
        .gte("data_horario", inicioFiltro)
        .lte("data_horario", fimFiltro)
        .eq("pagamento", "pago")
        .neq("status", "bloqueio")
        .neq("status", "cancelado");

      if (!profile?.is_admin) {
        queryGeral = queryGeral.eq("profissional_id", profile.id);
      }

      const { data, error } = await queryGeral;

      if (error) throw error;

      let sumTotal = 0;
      let sumPix = 0;
      let sumDinheiro = 0;
      let sumCartao = 0;
      const historicoGeral = [];

      if (data) {
        data.forEach((item) => {
          const clienteNome = item.customers?.nome || "Cliente Removido";
          if (busca && !clienteNome.toLowerCase().includes(busca.toLowerCase()))
            return;
          
          if (filtroFuncionariaGeral && item.profissionais?.id !== filtroFuncionariaGeral)
            return;

          const valorNum = Number(item.valor) || 0;
          sumTotal += valorNum;

          const forma = item.forma_pagamento || "Não informada";
          const formaStr = forma.toLowerCase();

          if (formaStr === "pix") sumPix += valorNum;
          else if (formaStr === "dinheiro") sumDinheiro += valorNum;
          else if (
            formaStr.includes("crédito") ||
            formaStr.includes("credito") ||
            formaStr.includes("débito") ||
            formaStr.includes("debito") ||
            formaStr.includes("cartão") ||
            formaStr.includes("cartao")
          ) {
            sumCartao += valorNum;
          }

          const dataObj = new Date(item.data_horario);
          historicoGeral.push({
            id: item.id,
            cliente: clienteNome,
            servico: item.servico,
            valor: formatarMoeda(valorNum),
            forma: forma,
            data: `${String(dataObj.getDate()).padStart(2, "0")}/${String(dataObj.getMonth() + 1).padStart(2, "0")}/${dataObj.getFullYear()}`,
            dataOrd: dataObj.getTime(),
          });
        });
      }

      let taxaComissaoProf = 50;
      if (!profile?.is_admin && profile?.id) {
        const { data: profData } = await supabase
          .from("profissionais")
          .select("comissao")
          .eq("id", profile.id)
          .single();
        if (profData?.comissao !== undefined && profData?.comissao !== null) {
          taxaComissaoProf = Number(profData.comissao);
        }
      }

      historicoGeral.sort((a, b) => b.dataOrd - a.dataOrd);
      const comissaoTotal = sumTotal * (taxaComissaoProf / 100);
      setMetricas({
        total: sumTotal,
        pix: sumPix,
        dinheiro: sumDinheiro,
        cartao: sumCartao,
        comissao: comissaoTotal,
        comissaoTaxa: taxaComissaoProf,
      });
      setHistoricoPagamentos(historicoGeral);
    } catch (error) {
      console.error("Erro geral:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. CARREGA O DESEMPENHO DA EQUIPE
  const carregarDesempenhoEquipe = async () => {
    try {
      setLoadingEquipe(true);
      const anoNum = Number(anoSelecionado);
      let inicioFiltro, fimFiltro;

      if (filtroDesempenho === "semana") {
        const hoje = new Date();
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

        inicioFiltro = `${dataDomingo.getFullYear()}-${String(dataDomingo.getMonth() + 1).padStart(2, "0")}-${String(dataDomingo.getDate()).padStart(2, "0")}T00:00:00`;
        fimFiltro = `${dataSabado.getFullYear()}-${String(dataSabado.getMonth() + 1).padStart(2, "0")}-${String(dataSabado.getDate()).padStart(2, "0")}T23:59:59`;
      } else {
        if (mesSelecionado === "Ano") {
          inicioFiltro = `${anoNum}-01-01T00:00:00`;
          fimFiltro = `${anoNum}-12-31T23:59:59`;
        } else {
          const mesIndex = meses.indexOf(mesSelecionado);
          const mesFormatado = String(mesIndex + 1).padStart(2, "0");
          const ultimoDiaMes = new Date(anoNum, mesIndex + 1, 0).getDate();
          inicioFiltro = `${anoNum}-${mesFormatado}-01T00:00:00`;
          fimFiltro = `${anoNum}-${mesFormatado}-${String(ultimoDiaMes).padStart(2, "0")}T23:59:59`;
        }
      }

      let query = supabase
        .from("appointments")
        .select(
          `
          id, valor, servico, data_horario, 
          profissionais ( id, nome, comissao ), 
          customers ( nome )
        `,
        )
        .gte("data_horario", inicioFiltro)
        .lte("data_horario", fimFiltro)
        .eq("pagamento", "pago")
        .neq("status", "bloqueio")
        .neq("status", "cancelado");

      if (!profile?.is_admin && profile?.id) {
        query = query.eq("profissional_id", profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapaDesempenho = {};
      const mapaAtendimentos = {};

      if (data) {
        data.forEach((item) => {
          const profId = item.profissionais?.id || "sem-prof";
          const profNome = item.profissionais?.nome || "Equipe";
          const clienteNome = item.customers?.nome || "Cliente Removido";
          const valorNum = Number(item.valor) || 0;

          const taxaComissao =
            item.profissionais?.comissao !== undefined &&
            item.profissionais?.comissao !== null
              ? Number(item.profissionais.comissao)
              : 50;

          if (busca && !clienteNome.toLowerCase().includes(busca.toLowerCase()))
            return;

          if (!mapaDesempenho[profId]) {
            mapaDesempenho[profId] = {
              id: profId,
              nome: profNome,
              totalProduzidoNum: 0,
              atendimentos: 0,
              comissaoPct: taxaComissao,
            };
            mapaAtendimentos[profId] = [];
          }

          mapaDesempenho[profId].totalProduzidoNum += valorNum;
          mapaDesempenho[profId].atendimentos += 1;

          const dataObj = new Date(item.data_horario);
          const comissaoItemVal = valorNum * (taxaComissao / 100);
          mapaAtendimentos[profId].push({
            id: item.id,
            cliente: clienteNome,
            servico: item.servico,
            valor: formatarMoeda(valorNum),
            comissaoItem: formatarMoeda(comissaoItemVal),
            data: `${String(dataObj.getDate()).padStart(2, "0")}/${String(dataObj.getMonth() + 1).padStart(2, "0")}/${dataObj.getFullYear()}`,
            dataOrd: dataObj.getTime(),
          });
        });
      }

      Object.keys(mapaAtendimentos).forEach((id) => {
        mapaAtendimentos[id].sort((a, b) => b.dataOrd - a.dataOrd);
      });

      const arrayFuncionarias = Object.values(mapaDesempenho)
        .map((prof) => {
          const valorComissaoReal =
            prof.totalProduzidoNum * (prof.comissaoPct / 100);
          return {
            ...prof,
            totalProduzido: formatarMoeda(prof.totalProduzidoNum),
            valorReceber: formatarMoeda(valorComissaoReal),
          };
        })
        .sort((a, b) => b.totalProduzidoNum - a.totalProduzidoNum);

      setFuncionarias(arrayFuncionarias);
      setAtendimentosPorProfissional(mapaAtendimentos);

      if (!profile?.is_admin && arrayFuncionarias.length > 0) {
        setProfSelecionada(arrayFuncionarias[0].id);
        setExpandirDesempenho(true);
      }
    } catch (error) {
      console.error("Erro desempenho equipe:", error.message);
    } finally {
      setLoadingEquipe(false);
    }
  };

  const handleAtualizarComissao = async (profId, novoValor) => {
    if (!profId || profId === "sem-prof") return;
    let valorLimpo = Number(novoValor);
    if (valorLimpo < 0) valorLimpo = 0;
    if (valorLimpo > 100) valorLimpo = 100;

    try {
      const { error } = await supabase
        .from("profissionais")
        .update({ comissao: valorLimpo })
        .eq("id", profId);
      if (error) throw error;
      carregarDesempenhoEquipe();
    } catch (error) {
      console.error("Erro ao atualizar comissão:", error.message);
      alert("Erro ao atualizar a porcentagem.");
    }
  };

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);

  const calcularResumoTipos = (idProfissional) => {
    const atendimentos = atendimentosPorProfissional[idProfissional] || [];
    const resumo = {};
    atendimentos.forEach((at) => {
      resumo[at.servico] = (resumo[at.servico] || 0) + 1;
    });
    return Object.entries(resumo).sort((a, b) => b[1] - a[1]);
  };

  const anosDisponiveis = Array.from({ length: 4 }, (_, i) =>
    (dataAtual.getFullYear() - 1 + i).toString(),
  );

  const totalPaginasGeral = Math.ceil(
    historicoPagamentos.length / itensPorPagina,
  );
  const historicoPaginado = historicoPagamentos.slice(
    (paginaGeral - 1) * itensPorPagina,
    paginaGeral * itensPorPagina,
  );

  const atendimentosDaProf = profSelecionada
    ? atendimentosPorProfissional[profSelecionada] || []
    : [];
  const totalPaginasProf = Math.ceil(
    atendimentosDaProf.length / itensPorPagina,
  );
  const profPaginado = atendimentosDaProf.slice(
    (paginaProf - 1) * itensPorPagina,
    paginaProf * itensPorPagina,
  );


  return (
    <div className="financeiro-container">
      <div className="financeiro-header">
        <div>
          <h2>Controle Financeiro</h2>
          <p>Gestão de fluxo de caixa e pagamentos</p>
        </div>
        <div className="financeiro-header-acoes">
          <div className="filtro-busca-container">
            <Search size={16} className="icone-busca" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input-busca"
            />
          </div>

          <button
            onClick={() => setMesSelecionado("Ano")}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s",
              border: "1px solid #CBD5E1",
              backgroundColor:
                mesSelecionado === "Ano" ? "var(--cor-primaria)" : "#FFFFFF",
              color: mesSelecionado === "Ano" ? "#FFFFFF" : "var(--cor-texto)",
              boxShadow:
                mesSelecionado === "Ano"
                  ? "0 4px 12px rgba(199, 75, 103, 0.2)"
                  : "none",
            }}
          >
            Ano Todo
          </button>

          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(e.target.value)}
            className="select-ano"
          >
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            onClick={() => setIsModalAvulsoOpen(true)}
          >
            <Plus size={16} /> Nova Venda
          </Button>
        </div>
      </div>

      <div className="meses-grid">
        {meses.map((mes) => (
          <button
            key={mes}
            className={`btn-mes ${mesSelecionado === mes ? "ativo" : ""}`}
            onClick={() => setMesSelecionado(mes)}
          >
            {mes}
          </button>
        ))}
      </div>

      {/* SKELETONS NOS CARDS DE MÉTRICAS */}
      <div className="metrics-grid">
        <div className="metric-card destaque">
          <div className="metric-info">
            <span>
              {profile?.is_admin ? "TOTAL FATURADO" : "MEU TOTAL PRODUZIDO"} ({mesSelecionado === "Ano" ? "ANO" : "MÊS"})
            </span>
            <h2>
              {loading ? (
                <Skeleton width="120px" height="36px" />
              ) : (
                formatarMoeda(metricas.total)
              )}
            </h2>
          </div>
          <div className="metric-icon primary">
            <DollarSign size={24} />
          </div>
        </div>

        {!profile?.is_admin ? (
          <div className="metric-card" style={{ borderColor: "#10B981", backgroundColor: "#F0FDF4" }}>
            <div className="metric-info">
              <span style={{ color: "#166534", fontWeight: "700" }}>MINHA COMISSÃO ({metricas.comissaoTaxa || 50}%)</span>
              <h2 style={{ color: "#15803D" }}>
                {loading ? (
                  <Skeleton width="100px" height="36px" />
                ) : (
                  formatarMoeda(metricas.comissao || 0)
                )}
              </h2>
            </div>
            <div className="metric-icon green">
              <Percent size={24} />
            </div>
          </div>
        ) : (
          <div className="metric-card">
            <div className="metric-info">
              <span>ENTRADAS VIA PIX</span>
              <h2>
                {loading ? (
                  <Skeleton width="100px" height="36px" />
                ) : (
                  formatarMoeda(metricas.pix)
                )}
              </h2>
            </div>
            <div className="metric-icon green">
              <QrCode size={24} />
            </div>
          </div>
        )}

        <div className="metric-card">
          <div className="metric-info">
            <span>{!profile?.is_admin ? "RECEBIDO EM PIX" : "ENTRADAS EM DINHEIRO"}</span>
            <h2>
              {loading ? (
                <Skeleton width="100px" height="36px" />
              ) : (
                formatarMoeda(!profile?.is_admin ? metricas.pix : metricas.dinheiro)
              )}
            </h2>
          </div>
          <div className="metric-icon blue">
            {!profile?.is_admin ? <QrCode size={24} /> : <Wallet size={24} />}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <span>{!profile?.is_admin ? "CARTÃO / DINHEIRO" : "ENTRADAS EM CARTÃO"}</span>
            <h2>
              {loading ? (
                <Skeleton width="100px" height="36px" />
              ) : (
                formatarMoeda(!profile?.is_admin ? (metricas.cartao + metricas.dinheiro) : metricas.cartao)
              )}
            </h2>
          </div>
          <div className="metric-icon purple">
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      {/* SEÇÃO: DESEMPENHO E COMISSÕES */}
      <div className="section-box mb-15">
        <div
          className="section-header-clickable"
          onClick={() => setExpandirDesempenho(!expandirDesempenho)}
        >
          <div className="section-title">
            <User size={20} />
            <h3>
              {profile?.is_admin ? "Comissão e Desempenho da Equipe" : "Minha Comissão e Desempenho"}
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "#64748B",
                  marginLeft: "8px",
                  fontWeight: "500",
                }}
              >
                (
                {filtroDesempenho === "semana"
                  ? "Semana Atual"
                  : mesSelecionado === "Ano"
                    ? anoSelecionado
                    : `${mesSelecionado}/${anoSelecionado}`}
                )
              </span>
            </h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                gap: "4px",
                backgroundColor: "#F1F5F9",
                padding: "4px",
                borderRadius: "8px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setFiltroDesempenho("semana")}
                style={{
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor:
                    filtroDesempenho === "semana" ? "#FFFFFF" : "transparent",
                  color:
                    filtroDesempenho === "semana"
                      ? "var(--cor-primaria)"
                      : "#64748B",
                  boxShadow:
                    filtroDesempenho === "semana"
                      ? "0 1px 3px rgba(0,0,0,0.1)"
                      : "none",
                }}
              >
                Semana Atual
              </button>
              <button
                onClick={() => setFiltroDesempenho("mes")}
                style={{
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor:
                    filtroDesempenho === "mes" ? "#FFFFFF" : "transparent",
                  color:
                    filtroDesempenho === "mes"
                      ? "var(--cor-primaria)"
                      : "#64748B",
                  boxShadow:
                    filtroDesempenho === "mes"
                      ? "0 1px 3px rgba(0,0,0,0.1)"
                      : "none",
                }}
              >
                {mesSelecionado === "Ano" ? "Ano Completo" : "Mês Selecionado"}
              </button>
            </div>

            {expandirDesempenho ? (
              <ChevronUp size={20} className="chevron-icon" />
            ) : (
              <ChevronDown size={20} className="chevron-icon" />
            )}
          </div>
        </div>

        {expandirDesempenho && (
          <div className="section-content">
            {/* SKELETONS NOS CARDS DE EQUIPE */}
            {loadingEquipe ? (
              <div className="prof-cards-grid">
                {[1, 2, 3].map((item) => (
                  <div
                    key={`skel-prof-${item}`}
                    className="prof-card"
                    style={{ pointerEvents: "none" }}
                  >
                    <div
                      className="prof-card-info"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <Skeleton width="120px" height="20px" />
                      <Skeleton width="180px" height="14px" />
                    </div>
                    <div
                      className="prof-card-valor"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "4px",
                      }}
                    >
                      <Skeleton width="80px" height="12px" />
                      <Skeleton width="100px" height="24px" />
                    </div>
                  </div>
                ))}
              </div>
            ) : funcionarias.length > 0 ? (
              <div className="prof-cards-grid">
                {funcionarias.map((prof) => (
                  <div
                    key={prof.id}
                    className={`prof-card ${profSelecionada === prof.id ? "ativo" : ""}`}
                    onClick={() =>
                      setProfSelecionada(
                        profSelecionada === prof.id ? null : prof.id,
                      )
                    }
                  >
                    <div className="prof-card-info">
                      <strong>{prof.nome}</strong>
                      <span
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        {prof.atendimentos}{" "}
                        {prof.atendimentos === 1
                          ? "atendimento"
                          : "atendimentos"}
                        <span
                          style={{
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            backgroundColor: "#CBD5E1",
                          }}
                        ></span>
                        Produzido: {prof.totalProduzido}
                      </span>
                    </div>
                    <div
                      className="prof-card-valor"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748B",
                          fontWeight: "600",
                        }}
                      >
                        A RECEBER ({prof.comissaoPct}%)
                      </span>
                      <strong
                        style={{
                          color: "#059669",
                          fontSize: "1.2rem",
                          marginTop: "2px",
                        }}
                      >
                        {prof.valorReceber}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="estado-vazio"
                style={{ padding: "2rem 0", color: "#64748B" }}
              >
                <p>
                  Nenhum atendimento pago registrado neste período para a
                  equipe.
                </p>
              </div>
            )}

            {profSelecionada && (
              <div className="prof-detalhes-container">
                <div
                  className="prof-detalhes-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <h4>
                      {profile?.is_admin
                        ? `Histórico Detalhado: ${funcionarias.find((f) => f.id === profSelecionada)?.nome}`
                        : "Meus Atendimentos e Comissões Detalhadas"}
                    </h4>

                    {profile?.is_admin ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "12px",
                          backgroundColor: "#F8FAFC",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #E2E8F0",
                          width: "fit-content",
                        }}
                      >
                        <Percent size={16} color="#64748B" />
                        <label
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            color: "#475569",
                          }}
                        >
                          Porcentagem de Comissão:
                        </label>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={
                              funcionarias.find((f) => f.id === profSelecionada)
                                ?.comissaoPct
                            }
                            onBlur={(e) =>
                              handleAtualizarComissao(
                                profSelecionada,
                                e.target.value,
                              )
                            }
                            style={{
                              width: "60px",
                              padding: "6px",
                              borderRadius: "6px",
                              border: "1px solid #CBD5E1",
                              textAlign: "center",
                              fontWeight: "700",
                              color: "var(--cor-primaria)",
                            }}
                          />
                          <span style={{ fontWeight: "700", color: "#64748B" }}>
                            %
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#94A3B8",
                            marginLeft: "8px",
                          }}
                        >
                          (Edite e clique fora para salvar)
                        </span>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "12px",
                          backgroundColor: "#F0FDF4",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          border: "1px solid #BBF7D0",
                          width: "fit-content",
                        }}
                      >
                        <Percent size={16} color="#16A34A" />
                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#166534" }}>
                          Sua Taxa de Comissão: <strong>{funcionarias.find((f) => f.id === profSelecionada)?.comissaoPct}%</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {profile?.is_admin && (
                    <button
                      className="btn-fechar"
                      onClick={() => setProfSelecionada(null)}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                <div className="prof-resumo-tags">
                  <span className="resumo-label">Serviços realizados:</span>
                  {calcularResumoTipos(profSelecionada).map(
                    ([tipo, quantidade]) => (
                      <div key={tipo} className="prof-tag">
                        <strong>{quantidade}</strong> {tipo}
                      </div>
                    ),
                  )}
                </div>

                {atendimentosDaProf.length > 0 && (
                  <div className="tabela-financeira mt-10">
                    <div
                      className="tabela-cabecalho prof-table"
                      style={{ gridTemplateColumns: "1fr 1.8fr 1.8fr 1.2fr 1.2fr" }}
                    >
                      <span>Data</span>
                      <span>Cliente</span>
                      <span>Serviço</span>
                      <span style={{ textAlign: "right" }}>
                        Valor Serviço
                      </span>
                      <span style={{ textAlign: "right" }}>
                        {profile?.is_admin ? "Comissão" : "Minha Comissão"}
                      </span>
                    </div>
                    {profPaginado.map((item) => (
                      <div
                        key={item.id}
                        className="tabela-linha prof-table"
                        style={{ gridTemplateColumns: "1fr 1.8fr 1.8fr 1.2fr 1.2fr" }}
                      >
                        <span className="texto-secundario">{item.data}</span>
                        <strong>{item.cliente}</strong>
                        <span>
                          <span className="tag-forma">{item.servico}</span>
                        </span>
                        <span
                          style={{ textAlign: "right", color: "#64748B" }}
                        >
                          {item.valor}
                        </span>
                        <span
                          className="valor-recebido"
                          style={{ textAlign: "right", color: "#059669", fontWeight: "700" }}
                        >
                          {item.comissaoItem}
                        </span>
                      </div>
                    ))}

                    {totalPaginasProf > 1 && (
                      <Pagination
                        paginaAtual={paginaProf}
                        setPaginaAtual={setPaginaProf}
                        totalPaginas={totalPaginasProf}
                        totalItems={atendimentosDaProf.length}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SEÇÃO: HISTÓRICO GERAL */}
      <div className="section-box">
        <div
          className={`section-header-clickable ${expandirHistorico ? "aberto" : ""}`}
          onClick={() => setExpandirHistorico(!expandirHistorico)}
        >
          <div className="section-title">
            <Calendar size={20} />
            <h3>
              Histórico Geral de Recebimentos -{" "}
              {mesSelecionado === "Ano"
                ? anoSelecionado
                : `${mesSelecionado}/${anoSelecionado}`}
            </h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <select
              value={filtroFuncionariaGeral}
              onChange={(e) => {
                e.stopPropagation();
                setFiltroFuncionariaGeral(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              className="select-ano"
              style={{ fontSize: "0.85rem", padding: "0.4rem 0.6rem" }}
            >
              <option value="">Todas as funcionárias</option>
              {funcionarias.map(f => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
            {expandirHistorico ? (
              <ChevronUp size={20} className="chevron-icon" />
            ) : (
              <ChevronDown size={20} className="chevron-icon" />
            )}
          </div>
        </div>

        {expandirHistorico && (
          <div className="section-content">
            {/* SKELETONS NA TABELA GERAL */}
            {loading ? (
              <div className="tabela-financeira">
                <div className="tabela-cabecalho geral-table">
                  <span>Cliente</span>
                  <span>Serviço</span>
                  <span>Forma de Pagto.</span>
                  <span>Data</span>
                  <span>Valor</span>
                </div>
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={`skel-historico-${item}`}
                    className="tabela-linha geral-table"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.5fr 1.5fr 1fr 1fr 1fr",
                      alignItems: "center",
                    }}
                  >
                    <Skeleton width="70%" height="20px" />
                    <Skeleton width="60%" height="20px" />
                    <Skeleton width="80px" height="24px" borderRadius="12px" />
                    <Skeleton width="90px" height="20px" />
                    <Skeleton width="80%" height="20px" />
                  </div>
                ))}
              </div>
            ) : historicoPagamentos.length > 0 ? (
              <div className="tabela-financeira">
                <div className="tabela-cabecalho geral-table">
                  <span>Cliente</span>
                  <span>Serviço</span>
                  <span>Forma de Pagto.</span>
                  <span>Data</span>
                  <span>Valor</span>
                </div>
                {historicoPaginado.map((item) => (
                  <div key={item.id} className="tabela-linha geral-table">
                    <strong>{item.cliente}</strong>
                    <span className="texto-secundario">{item.servico}</span>
                    <span>
                      <span className="tag-forma">{item.forma}</span>
                    </span>
                    <span className="texto-secundario">{item.data}</span>
                    <span className="valor-recebido">{item.valor}</span>
                  </div>
                ))}

                {totalPaginasGeral > 1 && (
                  <Pagination
                    paginaAtual={paginaGeral}
                    setPaginaAtual={setPaginaGeral}
                    totalPaginas={totalPaginasGeral}
                    totalItems={historicoPagamentos.length}
                  />
                )}
              </div>
            ) : (
              <div className="estado-vazio">
                <Calendar size={40} />
                <p>Nenhum recebimento registrado para este período.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ModalRecebimentoAvulso 
        isOpen={isModalAvulsoOpen} 
        onClose={() => setIsModalAvulsoOpen(false)}
        onSave={() => {
          setIsModalAvulsoOpen(false);
          carregarMetricasGerais();
        }}
      />
    </div>
  );
}
