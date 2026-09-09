import { useState, useMemo, useEffect } from "react";
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
  Edit2,
  Trash2,
  AlertCircle,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";
import { Pagination } from "../../components/ui/Pagination";
import { ModalRecebimentoAvulso } from "../../components/domain/ModalRecebimentoAvulso";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "../../lib/toast";
import {
  useFinanceiroMetricas,
  useFinanceiroDesempenho,
  useFinanceiroMutations,
  METRICAS_VAZIAS,
} from "../../hooks/useFinanceiro";

const MESES = [
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

export function Financeiro() {
  const { profile } = useAuth();

  const dataAtual = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(
    MESES[dataAtual.getMonth()],
  );
  const [anoSelecionado, setAnoSelecionado] = useState(
    dataAtual.getFullYear().toString(),
  );
  const [busca, setBusca] = useState("");
  const [filtroFuncionariaGeral, setFiltroFuncionariaGeral] = useState("");

  const [isModalAvulsoOpen, setIsModalAvulsoOpen] = useState(false);
  const [vendaEditando, setVendaEditando] = useState(null);
  const [vendaParaExcluir, setVendaParaExcluir] = useState(null);

  // Paginação (20 itens)
  const [paginaGeral, setPaginaGeral] = useState(1);
  const [paginaProf, setPaginaProf] = useState(1);
  const itensPorPagina = 20;

  // Filtro de desempenho da equipe
  const [filtroDesempenho, setFiltroDesempenho] = useState("mes");
  const [expandirDesempenho, setExpandirDesempenho] = useState(false);
  const [expandirHistorico, setExpandirHistorico] = useState(true);
  const [profSelecionada, setProfSelecionada] = useState(null);

  // Limite de datas para o período geral
  const { inicioFiltroGeral, fimFiltroGeral } = useMemo(() => {
    const anoNum = Number(anoSelecionado);
    if (mesSelecionado === "Ano") {
      return {
        inicioFiltroGeral: `${anoNum}-01-01T00:00:00`,
        fimFiltroGeral: `${anoNum}-12-31T23:59:59`,
      };
    }
    const mesIndex = MESES.indexOf(mesSelecionado);
    const mesFormatado = String(mesIndex + 1).padStart(2, "0");
    const ultimoDiaMes = new Date(anoNum, mesIndex + 1, 0).getDate();
    return {
      inicioFiltroGeral: `${anoNum}-${mesFormatado}-01T00:00:00`,
      fimFiltroGeral: `${anoNum}-${mesFormatado}-${String(ultimoDiaMes).padStart(2, "0")}T23:59:59`,
    };
  }, [mesSelecionado, anoSelecionado]);

  // Limite de datas para o filtro de desempenho
  const { inicioFiltroDesempenho, fimFiltroDesempenho } = useMemo(() => {
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
      return {
        inicioFiltroDesempenho: `${dataDomingo.getFullYear()}-${String(dataDomingo.getMonth() + 1).padStart(2, "0")}-${String(dataDomingo.getDate()).padStart(2, "0")}T00:00:00`,
        fimFiltroDesempenho: `${dataSabado.getFullYear()}-${String(dataSabado.getMonth() + 1).padStart(2, "0")}-${String(dataSabado.getDate()).padStart(2, "0")}T23:59:59`,
      };
    }
    return {
      inicioFiltroDesempenho: inicioFiltroGeral,
      fimFiltroDesempenho: fimFiltroGeral,
    };
  }, [filtroDesempenho, inicioFiltroGeral, fimFiltroGeral]);

  // Queries TanStack
  const {
    data: dataMetricas,
    isLoading: loadingGeral,
  } = useFinanceiroMetricas({
    inicioFiltro: inicioFiltroGeral,
    fimFiltro: fimFiltroGeral,
    profile,
    busca,
    filtroFuncionariaGeral,
  });

  const {
    data: dataDesempenho,
    isLoading: loadingEquipe,
  } = useFinanceiroDesempenho({
    inicioFiltro: inicioFiltroDesempenho,
    fimFiltro: fimFiltroDesempenho,
    profile,
    busca,
  });

  const {
    excluirVenda,
    isExcluindoVenda,
    atualizarComissao,
    invalidarFinanceiro,
  } = useFinanceiroMutations();

  const metricas = dataMetricas?.metricas || METRICAS_VAZIAS;
  const historicoPagamentos = dataMetricas?.historicoPagamentos || [];
  const funcionarias = useMemo(
    () => dataDesempenho?.funcionarias || [],
    [dataDesempenho],
  );
  const atendimentosPorProfissional =
    dataDesempenho?.atendimentosPorProfissional || {};

  // Reseta páginas em mudanças de filtro
  useEffect(() => {
    setPaginaGeral(1);
  }, [mesSelecionado, anoSelecionado, busca, filtroFuncionariaGeral]);

  useEffect(() => {
    setProfSelecionada(null);
  }, [mesSelecionado, anoSelecionado, filtroDesempenho, busca]);

  useEffect(() => {
    setPaginaProf(1);
  }, [profSelecionada]);

  // Auto-seleciona para funcionária não-admin
  useEffect(() => {
    if (!profile?.is_admin && funcionarias.length > 0 && !profSelecionada) {
      setProfSelecionada(funcionarias[0].id);
      setExpandirDesempenho(true);
    }
  }, [profile, funcionarias, profSelecionada]);

  const handleConfirmarExclusaoVenda = async () => {
    if (!vendaParaExcluir || isExcluindoVenda) return;
    try {
      await excluirVenda({
        vendaParaExcluir,
        tenantId: profile?.tenant_id,
      });
      toast.success("Venda excluída com sucesso.");
      setVendaParaExcluir(null);
    } catch (err) {
      console.error("Erro ao excluir venda:", err);
      toast.error("Erro ao excluir venda: " + (err.message || err));
    }
  };

  const handleAtualizarComissao = async (profId, novoValor) => {
    try {
      await atualizarComissao({ profId, novoValor });
      toast.success("Comissão atualizada.");
    } catch (error) {
      console.error("Erro ao atualizar comissão:", error);
      toast.error("Erro ao atualizar a porcentagem.");
    }
  };

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor || 0);

  const calcularResumoTipos = (idProfissional) => {
    const atendimentos = atendimentosPorProfissional[idProfissional] || [];
    const resumo = {};
    atendimentos.forEach((at) => {
      resumo[at.servico] = (resumo[at.servico] || 0) + 1;
    });
    return Object.entries(resumo).sort((a, b) => b[1] - a[1]);
  };

  const gerarRelatorioPDF = (profId) => {
    const prof = funcionarias.find((f) => f.id === profId);
    if (!prof) return;

    const atendimentos = atendimentosPorProfissional[profId] || [];
    let periodoFormatado;
    const anoNum = Number(anoSelecionado);

    if (filtroDesempenho === "semana") {
      const hoje = new Date();
      const diaSemana = hoje.getDay();
      const dataDom = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate() - diaSemana,
      );
      const dataSab = new Date(
        dataDom.getFullYear(),
        dataDom.getMonth(),
        dataDom.getDate() + 6,
      );
      const dInicio = `${String(dataDom.getDate()).padStart(2, "0")}/${String(dataDom.getMonth() + 1).padStart(2, "0")}/${dataDom.getFullYear()}`;
      const dFim = `${String(dataSab.getDate()).padStart(2, "0")}/${String(dataSab.getMonth() + 1).padStart(2, "0")}/${dataSab.getFullYear()}`;
      periodoFormatado = `${dInicio} a ${dFim}`;
    } else {
      if (mesSelecionado === "Ano") {
        periodoFormatado = `01/01/${anoNum} a 31/12/${anoNum}`;
      } else {
        const mesIndex = MESES.indexOf(mesSelecionado);
        const mesFormatado = String(mesIndex + 1).padStart(2, "0");
        const ultimoDiaMes = new Date(anoNum, mesIndex + 1, 0).getDate();
        periodoFormatado = `01/${mesFormatado}/${anoNum} a ${String(ultimoDiaMes).padStart(2, "0")}/${mesFormatado}/${anoNum}`;
      }
    }

    const agrupamentoServicos = {};
    let totalQtd = 0;
    let totalValorServicos = 0;
    let totalComissaoServicos = 0;

    atendimentos.forEach((at) => {
      const nomeServ = at.servico || "Outros Serviços";
      const val = Number(at.valorNum) || 0;
      const comiss = Number(at.comissaoNum) || 0;

      if (!agrupamentoServicos[nomeServ]) {
        agrupamentoServicos[nomeServ] = {
          nome: nomeServ,
          quantidade: 0,
          valorTotal: 0,
          comissaoTotal: 0,
        };
      }

      agrupamentoServicos[nomeServ].quantidade += 1;
      agrupamentoServicos[nomeServ].valorTotal += val;
      agrupamentoServicos[nomeServ].comissaoTotal += comiss;

      totalQtd += 1;
      totalValorServicos += val;
      totalComissaoServicos += comiss;
    });

    const formatarNum = (num) =>
      new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num || 0);

    const linhasServicosHTML = Object.values(agrupamentoServicos)
      .map(
        (item) => `
        <tr>
          <td style="border: 1px solid #777; padding: 6px 10px; font-size: 12px; color: #111;">${item.nome}</td>
          <td style="border: 1px solid #777; padding: 6px 10px; font-size: 12px; text-align: center; color: #111;">${item.quantidade}</td>
          <td style="border: 1px solid #777; padding: 6px 10px; font-size: 12px; text-align: right; color: #111;">${formatarNum(item.valorTotal)}</td>
          <td style="border: 1px solid #777; padding: 6px 10px; font-size: 12px; text-align: right; font-weight: 600; color: #111;">${formatarNum(item.comissaoTotal)}</td>
        </tr>
      `,
      )
      .join("");

    const htmlRelatorio = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Resumo Financeiro - ${prof.nome}</title>
        <style>
          @page { size: A4; margin: 18mm 15mm; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #000000;
            margin: 0;
            padding: 0;
            background: #ffffff;
          }
          .topo-header {
            text-align: center;
            margin-bottom: 25px;
            position: relative;
          }
          .titulo-documento {
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .nome-profissional {
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .periodo-venda {
            font-size: 12px;
            color: #333333;
          }
          .secao-titulo {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            margin-top: 25px;
            margin-bottom: 6px;
          }
          .secao-subtitulo {
            font-size: 12px;
            font-style: italic;
            margin-bottom: 4px;
            color: #222222;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          th {
            background-color: #d9d9d9;
            border: 1px solid #777777;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 700;
            text-align: center;
          }
          td {
            border: 1px solid #777777;
            padding: 5px 10px;
            font-size: 12px;
          }
          .linha-total td {
            font-weight: 700;
            background-color: #ffffff;
          }
          .tabela-resumo td {
            padding: 4px 10px;
            font-size: 12px;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="topo-header">
          <div class="titulo-documento">RESUMO FINANCEIRO</div>
          <div class="nome-profissional">${prof.nome}</div>
          <div class="periodo-venda">Período de Atendimento/Venda: ${periodoFormatado}</div>
        </div>

        <div class="secao-titulo">DESCRITIVO DAS RECEITAS VARIÁVEIS NO PERÍODO</div>
        <div class="secao-subtitulo">Sobre Serviços</div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 55%;">Serviço</th>
              <th style="text-align: center; width: 12%;">Quantidade</th>
              <th style="text-align: center; width: 16%;">Valor em Serviços R$</th>
              <th style="text-align: center; width: 17%;">Comissão Profissional R$</th>
            </tr>
          </thead>
          <tbody>
            ${linhasServicosHTML || '<tr><td colspan="4" style="text-align: center; padding: 15px; color: #666;">Nenhum atendimento realizado no período.</td></tr>'}
            <tr class="linha-total">
              <td style="text-align: right;">Total</td>
              <td style="text-align: center;">${totalQtd}</td>
              <td style="text-align: right;">${formatarNum(totalValorServicos)}</td>
              <td style="text-align: right;">${formatarNum(totalComissaoServicos)}</td>
            </tr>
          </tbody>
        </table>

        <div class="secao-titulo">RESUMO</div>

        <table class="tabela-resumo">
          <thead>
            <tr>
              <th colspan="2" style="width: 50%;">Recebimentos</th>
              <th colspan="2" style="width: 50%;">Descontos</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border-right: none; width: 35%;">Sobre Serviços</td>
              <td style="border-left: none; text-align: right; font-weight: 600; width: 15%;">${formatarNum(totalComissaoServicos)}</td>
              <td style="border-right: none; width: 35%;">Abatimentos adicionais</td>
              <td style="border-left: none; text-align: right; width: 15%;">0,00</td>
            </tr>
            <tr>
              <td style="border-right: none;">Sobre Produtos Vendidos</td>
              <td style="border-left: none; text-align: right;">0,00</td>
              <td style="border-right: none;">Compra/Uso de Produtos</td>
              <td style="border-left: none; text-align: right;">0,00</td>
            </tr>
            <tr>
              <td style="border-right: none;">Sobre Pacotes Vendidos</td>
              <td style="border-left: none; text-align: right;">0,00</td>
              <td style="border-right: none;"></td>
              <td style="border-left: none;"></td>
            </tr>
            <tr>
              <td style="border-right: none;">Recebíveis adicionais</td>
              <td style="border-left: none; text-align: right;">0,00</td>
              <td style="border-right: none;"></td>
              <td style="border-left: none;"></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Por favor, permita popups para gerar e imprimir o PDF.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlRelatorio);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
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
    <div className="p-6 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] min-h-[calc(100vh-3rem)] text-[var(--cor-texto,#334155)] font-['Inter',sans-serif] flex flex-col max-md:p-3.5 print:p-0 print:shadow-none print:border-none print:m-0">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-100 flex-wrap gap-4 max-md:flex-col max-md:items-start print:hidden">
        <div>
          <h2 className="text-[1.6rem] font-bold text-[var(--cor-texto,#334155)] tracking-[-0.5px] mb-1 max-md:text-[1.35rem]">
            Controle Financeiro
          </h2>
          <p className="text-slate-500 text-[0.95rem]">
            Gestão de fluxo de caixa e pagamentos
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap max-md:w-full max-md:justify-start">
          <div className="relative flex items-center max-md:w-full">
            <Search size={16} className="absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-2.5 pr-3 pl-9 text-sm text-[var(--cor-texto)] outline-none transition-all w-[200px] focus:border-[var(--cor-primaria)] focus:bg-white max-md:w-full"
              disabled={loadingGeral}
            />
          </div>

          <button
            type="button"
            onClick={() => setMesSelecionado("Ano")}
            className={`py-2.5 px-4 rounded-lg font-semibold text-[0.85rem] cursor-pointer transition-all border ${
              mesSelecionado === "Ano"
                ? "bg-[var(--cor-primaria)] text-white border-[var(--cor-primaria)] shadow-[0_4px_12px_rgba(199,75,103,0.2)]"
                : "bg-white text-[var(--cor-texto)] border-slate-300 hover:border-[var(--cor-primaria)]"
            }`}
          >
            Ano Todo
          </button>

          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm font-semibold text-[var(--cor-texto)] outline-none cursor-pointer focus:border-[var(--cor-primaria)]"
          >
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setVendaEditando(null);
              setIsModalAvulsoOpen(true);
            }}
            className="bg-gradient-to-br from-[var(--cor-primaria)] to-[#6d28d9] text-white border-none py-3 px-5 rounded-lg text-[0.95rem] font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-[0_4px_12px_rgba(124,58,237,0.25)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(124,58,237,0.35)] max-md:w-full max-md:justify-center"
          >
            <Plus size={16} /> Nova Venda
          </button>
        </div>
      </div>

      {/* Grid de Meses */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(65px,1fr))] gap-2 mb-6 max-md:grid-cols-4 print:hidden">
        {MESES.map((mes) => (
          <button
            key={mes}
            type="button"
            className={`border rounded-lg py-2.5 text-sm font-semibold cursor-pointer transition-all text-center ${
              mesSelecionado === mes
                ? "bg-[var(--cor-primaria)] border-[var(--cor-primaria)] text-white shadow-[0_4px_10px_rgba(124,58,237,0.25)]"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:border-[var(--cor-primaria)] hover:text-[var(--cor-primaria)]"
            }`}
            onClick={() => setMesSelecionado(mes)}
          >
            {mes}
          </button>
        ))}
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 mb-6 max-md:grid-cols-1 print:page-break-inside-avoid">
        <div className="bg-gradient-to-br from-white to-purple-50/50 border border-purple-100 rounded-xl p-5 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:border-[var(--cor-primaria)]">
          <div>
            <span className="text-xs font-bold text-[var(--cor-primaria)] tracking-wider">
              {profile?.is_admin ? "TOTAL FATURADO" : "MEU TOTAL PRODUZIDO"} (
              {mesSelecionado === "Ano" ? "ANO" : "MÊS"})
            </span>
            <h2 className="text-[1.5rem] font-bold text-[var(--cor-texto,#334155)] mt-1">
              {loadingGeral ? (
                <Skeleton width="120px" height="36px" />
              ) : (
                formatarMoeda(metricas.total)
              )}
            </h2>
          </div>
          <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center bg-purple-100/60 text-[var(--cor-primaria)]">
            <DollarSign size={24} />
          </div>
        </div>

        {!profile?.is_admin ? (
          <div className="bg-emerald-50 border border-emerald-500 rounded-xl p-5 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:border-emerald-600">
            <div>
              <span className="text-xs font-bold text-emerald-800 tracking-wider">
                MINHA COMISSÃO ({metricas.comissaoTaxa || 50}%)
              </span>
              <h2 className="text-[1.5rem] font-bold text-emerald-700 mt-1">
                {loadingGeral ? (
                  <Skeleton width="100px" height="36px" />
                ) : (
                  formatarMoeda(metricas.comissao || 0)
                )}
              </h2>
            </div>
            <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center bg-emerald-100 text-emerald-700">
              <Percent size={24} />
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:border-[var(--cor-primaria)]">
            <div>
              <span className="text-xs font-bold text-slate-500 tracking-wider">
                ENTRADAS VIA PIX
              </span>
              <h2 className="text-[1.5rem] font-bold text-[var(--cor-texto,#334155)] mt-1">
                {loadingGeral ? (
                  <Skeleton width="100px" height="36px" />
                ) : (
                  formatarMoeda(metricas.pix)
                )}
              </h2>
            </div>
            <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center bg-emerald-100 text-emerald-700">
              <QrCode size={24} />
            </div>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:border-[var(--cor-primaria)]">
          <div>
            <span className="text-xs font-bold text-slate-500 tracking-wider">
              {!profile?.is_admin ? "RECEBIDO EM PIX" : "ENTRADAS EM DINHEIRO"}
            </span>
            <h2 className="text-[1.5rem] font-bold text-[var(--cor-texto,#334155)] mt-1">
              {loadingGeral ? (
                <Skeleton width="100px" height="36px" />
              ) : (
                formatarMoeda(!profile?.is_admin ? metricas.pix : metricas.dinheiro)
              )}
            </h2>
          </div>
          <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center bg-blue-100 text-blue-700">
            {!profile?.is_admin ? <QrCode size={24} /> : <Wallet size={24} />}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex justify-between items-center shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:border-[var(--cor-primaria)]">
          <div>
            <span className="text-xs font-bold text-slate-500 tracking-wider">
              {!profile?.is_admin ? "CARTÃO / DINHEIRO" : "ENTRADAS EM CARTÃO"}
            </span>
            <h2 className="text-[1.5rem] font-bold text-[var(--cor-texto,#334155)] mt-1">
              {loadingGeral ? (
                <Skeleton width="100px" height="36px" />
              ) : (
                formatarMoeda(
                  !profile?.is_admin
                    ? metricas.cartao + metricas.dinheiro
                    : metricas.cartao,
                )
              )}
            </h2>
          </div>
          <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center bg-purple-100 text-purple-700">
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      {/* Seção: Desempenho e Comissões */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)] mb-6 print:p-0 print:shadow-none print:border-none">
        <div
          className="flex justify-between items-center cursor-pointer select-none py-1"
          onClick={() => setExpandirDesempenho(!expandirDesempenho)}
        >
          <div className="flex items-center gap-2.5 text-[var(--cor-texto)]">
            <User size={20} />
            <h3 className="text-[1.1rem] font-semibold m-0">
              {profile?.is_admin
                ? "Comissão e Desempenho da Equipe"
                : "Minha Comissão e Desempenho"}
              <span className="text-[0.85rem] text-slate-500 ml-2 font-medium">
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
          <div className="flex items-center gap-4">
            <div
              className="flex gap-1 bg-slate-100 p-1 rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setFiltroDesempenho("semana")}
                className={`border-none py-1 px-2.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  filtroDesempenho === "semana"
                    ? "bg-white text-[var(--cor-primaria)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                    : "bg-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Semana Atual
              </button>
              <button
                type="button"
                onClick={() => setFiltroDesempenho("mes")}
                className={`border-none py-1 px-2.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  filtroDesempenho === "mes"
                    ? "bg-white text-[var(--cor-primaria)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                    : "bg-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {mesSelecionado === "Ano" ? "Ano Completo" : "Mês Selecionado"}
              </button>
            </div>

            {expandirDesempenho ? (
              <ChevronUp size={20} className="text-slate-400" />
            ) : (
              <ChevronDown size={20} className="text-slate-400" />
            )}
          </div>
        </div>

        {expandirDesempenho && (
          <div className="pt-4">
            {loadingEquipe ? (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={`skel-prof-${item}`}
                    className="bg-white border border-slate-200 rounded-lg p-5 flex justify-between items-center pointer-events-none"
                  >
                    <div className="flex flex-col gap-2">
                      <Skeleton width="120px" height="20px" />
                      <Skeleton width="180px" height="14px" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Skeleton width="80px" height="12px" />
                      <Skeleton width="100px" height="24px" />
                    </div>
                  </div>
                ))}
              </div>
            ) : funcionarias.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-4 max-md:grid-cols-1">
                {funcionarias.map((prof) => (
                  <div
                    key={prof.id}
                    className={`border rounded-lg p-5 flex justify-between items-center cursor-pointer transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] ${
                      profSelecionada === prof.id
                        ? "border-[var(--cor-primaria)] bg-gradient-to-br from-white to-purple-50/50 shadow-[0_4px_12px_rgba(124,58,237,0.15)]"
                        : "bg-white border-slate-200 hover:border-[var(--cor-primaria)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(124,58,237,0.1)]"
                    }`}
                    onClick={() =>
                      setProfSelecionada(
                        profSelecionada === prof.id ? null : prof.id,
                      )
                    }
                  >
                    <div className="flex flex-col">
                      <strong className="text-[1.05rem] text-[var(--cor-texto,#334155)]">
                        {prof.nome}
                      </strong>
                      <span className="text-xs text-slate-500 mt-1 flex gap-1.5 flex-wrap items-center">
                        {prof.atendimentos}{" "}
                        {prof.atendimentos === 1
                          ? "atendimento"
                          : "atendimentos"}
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        Produzido: {prof.totalProduzido}
                      </span>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                      <span className="text-[0.75rem] text-slate-500 font-semibold">
                        A RECEBER ({prof.comissaoPct}%)
                      </span>
                      <strong className="text-emerald-600 text-[1.2rem] mt-0.5">
                        {prof.valorReceber}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500">
                <p>
                  Nenhum atendimento pago registrado neste período para a
                  equipe.
                </p>
              </div>
            )}

            {profSelecionada && (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-6 mt-4 animate-in fade-in duration-300">
                <div className="flex justify-between items-start gap-3 flex-wrap mb-5 max-md:flex-col max-md:items-stretch">
                  <div className="flex-1 min-w-[250px] max-md:min-w-full">
                    <h4 className="text-[1.15rem] font-bold text-[var(--cor-texto,#334155)] m-0">
                      {profile?.is_admin
                        ? `Histórico Detalhado: ${funcionarias.find((f) => f.id === profSelecionada)?.nome}`
                        : "Meus Atendimentos e Comissões Detalhadas"}
                    </h4>

                    {profile?.is_admin ? (
                      <div className="flex items-center gap-2 mt-3 bg-slate-50 py-2 px-3 rounded-lg border border-slate-200 w-fit">
                        <Percent size={16} className="text-slate-400" />
                        <label className="text-[0.85rem] font-semibold text-slate-600">
                          Porcentagem de Comissão:
                        </label>
                        <div className="flex items-center gap-1">
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
                            className="w-[60px] p-1.5 rounded-md border border-slate-300 text-center font-bold text-[var(--cor-primaria)] outline-none focus:border-[var(--cor-primaria)]"
                          />
                          <span className="font-bold text-slate-500">%</span>
                        </div>
                        <span className="text-xs text-slate-400 ml-2">
                          (Edite e clique fora para salvar)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-3 bg-emerald-50 py-2 px-3.5 rounded-lg border border-emerald-200 w-fit">
                        <Percent size={16} className="text-emerald-600" />
                        <span className="text-[0.85rem] font-semibold text-emerald-800">
                          Sua Taxa de Comissão:{" "}
                          <strong>
                            {
                              funcionarias.find((f) => f.id === profSelecionada)
                                ?.comissaoPct
                            }
                            %
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap max-md:w-full max-md:justify-between">
                    <button
                      type="button"
                      onClick={() => gerarRelatorioPDF(profSelecionada)}
                      className="inline-flex items-center justify-center gap-1.5 bg-[var(--cor-primaria)] text-white border-none py-2 px-3.5 rounded-lg font-semibold text-[0.85rem] cursor-pointer shadow-[0_2px_6px_rgba(124,58,237,0.2)] transition-all hover:opacity-90 hover:-translate-y-0.5 whitespace-nowrap max-md:flex-1"
                      title="Gerar e Imprimir Relatório em PDF"
                    >
                      <FileText size={16} />
                      <span>Gerar Relatório PDF</span>
                    </button>

                    {profile?.is_admin && (
                      <button
                        type="button"
                        className="bg-transparent border-none text-slate-400 cursor-pointer flex items-center justify-center rounded-full p-1.5 transition-all hover:bg-slate-200 hover:text-rose-600"
                        onClick={() => setProfSelecionada(null)}
                        title="Fechar histórico"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-3 mb-4 pb-4 border-b border-slate-200">
                  <span className="text-[0.85rem] text-slate-500 font-medium">
                    Serviços realizados:
                  </span>
                  {calcularResumoTipos(profSelecionada).map(
                    ([tipo, quantidade]) => (
                      <div
                        key={tipo}
                        className="bg-white border border-slate-200 py-1 px-3 rounded-full text-[0.85rem] text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                      >
                        <strong className="text-[var(--cor-primaria)] mr-1">
                          {quantidade}
                        </strong>{" "}
                        {tipo}
                      </div>
                    ),
                  )}
                </div>

                {atendimentosDaProf.length > 0 && (
                  <div className="flex flex-col gap-2 overflow-x-auto mt-4">
                    <div
                      className="grid py-2 px-4 text-xs font-bold text-slate-500 tracking-wider border-b border-slate-200 min-w-[550px]"
                      style={{
                        gridTemplateColumns: "1fr 1.8fr 1.8fr 1.2fr 1.2fr",
                      }}
                    >
                      <span>Data</span>
                      <span>Cliente</span>
                      <span>Serviço</span>
                      <span className="text-right">Valor Serviço</span>
                      <span className="text-right">
                        {profile?.is_admin ? "Comissão" : "Minha Comissão"}
                      </span>
                    </div>
                    {profPaginado.map((item) => (
                      <div
                        key={item.id}
                        className="grid items-center py-3.5 px-4 bg-white border border-slate-200 rounded-lg text-[0.9rem] min-w-[550px]"
                        style={{
                          gridTemplateColumns: "1fr 1.8fr 1.8fr 1.2fr 1.2fr",
                        }}
                      >
                        <span className="text-slate-500 text-[0.85rem]">
                          {item.data}
                        </span>
                        <strong>{item.cliente}</strong>
                        <span>
                          <span className="bg-slate-100 py-1 px-2.5 rounded-md text-xs font-semibold text-slate-600">
                            {item.servico}
                          </span>
                        </span>
                        <span className="text-right text-slate-500">
                          {item.valor}
                        </span>
                        <span className="text-right text-emerald-600 font-bold">
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

      {/* Seção: Histórico Geral */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)] print:p-0 print:shadow-none print:border-none">
        <div
          className="flex justify-between items-center cursor-pointer select-none py-1"
          onClick={() => setExpandirHistorico(!expandirHistorico)}
        >
          <div className="flex items-center gap-2.5 text-[var(--cor-texto)]">
            <Calendar size={20} />
            <h3 className="text-[1.1rem] font-semibold m-0">
              Histórico Geral de Recebimentos -{" "}
              {mesSelecionado === "Ano"
                ? anoSelecionado
                : `${mesSelecionado}/${anoSelecionado}`}
            </h3>
          </div>
          <div className="flex items-center gap-2.5">
            <select
              value={filtroFuncionariaGeral}
              onChange={(e) => {
                e.stopPropagation();
                setFiltroFuncionariaGeral(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-[0.85rem] font-semibold text-[var(--cor-texto)] outline-none cursor-pointer focus:border-[var(--cor-primaria)]"
            >
              <option value="">Todas as funcionárias</option>
              {funcionarias.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
            {expandirHistorico ? (
              <ChevronUp size={20} className="text-slate-400" />
            ) : (
              <ChevronDown size={20} className="text-slate-400" />
            )}
          </div>
        </div>

        {expandirHistorico && (
          <div className="pt-4">
            {loadingGeral ? (
              <div className="flex flex-col gap-2 overflow-x-auto">
                <div
                  className="grid py-2 px-4 text-xs font-bold text-slate-500 tracking-wider border-b border-slate-200 min-w-[620px]"
                  style={{
                    gridTemplateColumns: "1.6fr 2fr 1.1fr 1fr 1fr 75px",
                  }}
                >
                  <span>Cliente</span>
                  <span>Serviço / Item</span>
                  <span>Forma de Pagto.</span>
                  <span>Data</span>
                  <span>Valor</span>
                  <span className="text-center">Ações</span>
                </div>
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={`skel-historico-${item}`}
                    className="grid items-center py-3.5 px-4 bg-white border border-slate-200 rounded-lg text-[0.9rem] min-w-[620px]"
                    style={{
                      gridTemplateColumns: "1.5fr 1.8fr 1fr 1fr 1fr 80px",
                    }}
                  >
                    <Skeleton width="70%" height="20px" />
                    <Skeleton width="60%" height="20px" />
                    <Skeleton width="80px" height="24px" borderRadius="12px" />
                    <Skeleton width="90px" height="20px" />
                    <Skeleton width="80%" height="20px" />
                    <Skeleton width="50px" height="20px" />
                  </div>
                ))}
              </div>
            ) : historicoPagamentos.length > 0 ? (
              <div className="flex flex-col gap-2 overflow-x-auto">
                <div
                  className="grid py-2 px-4 text-xs font-bold text-slate-500 tracking-wider border-b border-slate-200 min-w-[620px]"
                  style={{
                    gridTemplateColumns: "1.6fr 2fr 1.1fr 1fr 1fr 75px",
                  }}
                >
                  <span>Cliente</span>
                  <span>Serviço / Item</span>
                  <span>Forma de Pagto.</span>
                  <span>Data</span>
                  <span>Valor</span>
                  <span className="text-center">Ações</span>
                </div>
                {historicoPaginado.map((item) => (
                  <div
                    key={item.id}
                    className="grid items-center py-3.5 px-4 bg-white border border-slate-200 rounded-lg text-[0.9rem] min-w-[620px]"
                    style={{
                      gridTemplateColumns: "1.6fr 2fr 1.1fr 1fr 1fr 75px",
                    }}
                  >
                    <strong>{item.cliente}</strong>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.isVenda && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[0.72rem] font-bold py-0.5 px-1.5 rounded-md whitespace-nowrap">
                          <ShoppingBag size={12} /> Venda
                        </span>
                      )}
                      <span className="text-slate-500 text-[0.85rem]">
                        {item.servico}
                      </span>
                    </div>
                    <span>
                      <span className="bg-slate-100 py-1 px-2 rounded-md text-xs font-semibold text-slate-600">
                        {item.forma}
                      </span>
                    </span>
                    <span className="text-slate-500 text-[0.85rem]">
                      {item.data}
                    </span>
                    <span className="font-bold text-[var(--cor-primaria)]">
                      {item.valor}
                    </span>
                    <div className="flex items-center justify-center gap-1.5">
                      {item.isVenda ? (
                        <>
                          <button
                            type="button"
                            className="bg-transparent border border-slate-200 rounded-md w-7 h-7 inline-flex items-center justify-center cursor-pointer transition-all text-[var(--cor-primaria,#7c3aed)] hover:bg-purple-50 hover:border-purple-300 hover:scale-105"
                            title="Editar Venda"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVendaEditando(item);
                              setIsModalAvulsoOpen(true);
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="bg-transparent border border-slate-200 rounded-md w-7 h-7 inline-flex items-center justify-center cursor-pointer transition-all text-red-500 hover:bg-red-50 hover:border-red-300 hover:scale-105"
                            title="Excluir Venda"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVendaParaExcluir(item);
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-500 opacity-40">-</span>
                      )}
                    </div>
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
              <div className="flex flex-col items-center justify-center py-12 px-4 text-slate-400 gap-3">
                <Calendar size={40} />
                <p className="text-[0.95rem] m-0">
                  Nenhum recebimento registrado para este período.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Criação e Edição de Venda */}
      <ModalRecebimentoAvulso
        isOpen={isModalAvulsoOpen}
        vendaEditando={vendaEditando}
        onClose={() => {
          setIsModalAvulsoOpen(false);
          setVendaEditando(null);
        }}
        onSave={() => {
          setIsModalAvulsoOpen(false);
          setVendaEditando(null);
          invalidarFinanceiro();
        }}
      />

      {/* Modal de Confirmação de Exclusão de Venda */}
      {vendaParaExcluir && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !isExcluindoVenda && setVendaParaExcluir(null)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-[440px] w-[90%] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                  <Trash2 size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">
                  Excluir Venda
                </h2>
              </div>
              <button
                type="button"
                className="bg-transparent border-none text-slate-400 cursor-pointer flex items-center justify-center rounded-full p-1.5 transition-all hover:bg-slate-100 hover:text-red-500"
                onClick={() => setVendaParaExcluir(null)}
                disabled={isExcluindoVenda}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4 py-4">
              <p className="text-slate-700 text-[0.95rem] leading-[1.45] m-0">
                Tem certeza que deseja excluir esta venda de{" "}
                <strong>"{vendaParaExcluir.servico}"</strong> no valor de{" "}
                <strong>{vendaParaExcluir.valor}</strong>?
              </p>
              <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-800 text-[0.85rem] leading-[1.4]">
                <AlertCircle size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  O valor será debitado do faturamento e as unidades vendidas
                  serão{" "}
                  <strong>devolvidas ao estoque do produto</strong>.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                className="py-2.5 px-4 rounded-lg font-semibold text-sm cursor-pointer transition-all border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                onClick={() => setVendaParaExcluir(null)}
                disabled={isExcluindoVenda}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="py-2.5 px-5 rounded-lg font-semibold text-sm cursor-pointer transition-all border-none bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleConfirmarExclusaoVenda}
                disabled={isExcluindoVenda}
              >
                {isExcluindoVenda ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
