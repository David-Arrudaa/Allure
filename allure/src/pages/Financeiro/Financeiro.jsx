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
  Edit2,
  Trash2,
  AlertCircle,
  ShoppingBag,
  FileText,
} from "lucide-react";
import {
  fetchPagamentosPeriodo,
  fetchComissaoProfissional,
  fetchDesempenhoPeriodo,
  atualizarComissaoProfissional,
  buscarProdutoPorNome,
  ajustarEstoqueProduto,
  excluirVendaAvulsa,
} from "../../services/financeiroService";
import { Skeleton } from "../../components/ui/Skeleton";
import { Pagination } from "../../components/ui/Pagination";
import { ModalRecebimentoAvulso } from "../../components/domain/ModalRecebimentoAvulso";
import { useAuth } from "../../contexts/AuthContext";
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
  const [vendaEditando, setVendaEditando] = useState(null);
  const [vendaParaExcluir, setVendaParaExcluir] = useState(null);
  const [isExcluindoVenda, setIsExcluindoVenda] = useState(false);

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

      const data = await fetchPagamentosPeriodo({
        inicioFiltro,
        fimFiltro,
        apenasProfissionalId: !profile?.is_admin ? profile.id : null,
      });

      let sumTotal = 0;
      let sumPix = 0;
      let sumDinheiro = 0;
      let sumCartao = 0;
      const historicoGeral = [];

      if (data) {
        data.forEach((item) => {
          const isVenda =
            item.duracao === 0 ||
            String(item.servico || "").toLowerCase().startsWith("venda:");
          const clienteNome = item.customers?.nome
            ? item.customers.nome
            : isVenda
              ? "Venda Balcão (Avulsa)"
              : item.customer_id
                ? "Cliente Removido"
                : "Não informado";
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
            clienteId: item.customer_id,
            profissionalId: item.profissional_id,
            servico: item.servico,
            valor: formatarMoeda(valorNum),
            valorNum: valorNum,
            forma: forma,
            data: `${String(dataObj.getDate()).padStart(2, "0")}/${String(dataObj.getMonth() + 1).padStart(2, "0")}/${dataObj.getFullYear()}`,
            dataIso: item.data_horario ? item.data_horario.split("T")[0] : "",
            dataOrd: dataObj.getTime(),
            isVenda: isVenda,
          });
        });
      }

      let taxaComissaoProf = 50;
      if (!profile?.is_admin && profile?.id) {
        const profData = await fetchComissaoProfissional(profile.id);
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

  const handleConfirmarExclusaoVenda = async () => {
    if (!vendaParaExcluir || isExcluindoVenda) return;
    setIsExcluindoVenda(true);
    try {
      const tenantId = profile?.tenant_id;
      if (vendaParaExcluir.servico && tenantId) {
        // Extrair nome do produto e quantidade
        const match = vendaParaExcluir.servico.match(
          /Venda:\s*(.*?)(?:\s*\((\d+)x\))?$/i,
        );
        const nomeProd = match
          ? match[1]?.trim()
          : vendaParaExcluir.servico.replace(/^Venda:\s*/i, "").trim();
        const qtd = match && match[2] ? Number(match[2]) : 1;

        if (nomeProd) {
          const prods = await buscarProdutoPorNome(tenantId, nomeProd);
          if (prods) {
            const estoqueAtual = Number(prods.estoque || 0);
            try {
              await ajustarEstoqueProduto(prods.id, tenantId, estoqueAtual + qtd);
            } catch (errEstoque) {
              console.warn("Falha ao ajustar estoque (comportamento não-bloqueante):", errEstoque.message);
            }
          }
        }
      }

      await excluirVendaAvulsa(vendaParaExcluir.id);

      setVendaParaExcluir(null);
      await carregarMetricasGerais();
      await carregarDesempenhoEquipe();
    } catch (err) {
      console.error("Erro ao excluir venda:", err);
      alert("Erro ao excluir venda: " + (err.message || err));
    } finally {
      setIsExcluindoVenda(false);
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

      const data = await fetchDesempenhoPeriodo({
        inicioFiltro,
        fimFiltro,
        apenasProfissionalId: !profile?.is_admin && profile?.id ? profile.id : null,
      });

      const mapaDesempenho = {};
      const mapaAtendimentos = {};

      if (data) {
        data.forEach((item) => {
          const profId = item.profissionais?.id || "sem-prof";
          const profNome = item.profissionais?.nome || "Equipe";
          const isVendaAvulsa =
            item.duracao === 0 ||
            String(item.servico || "").toLowerCase().startsWith("venda:");
          const clienteNome = item.customers?.nome
            ? item.customers.nome
            : isVendaAvulsa
              ? "Venda Balcão (Avulsa)"
              : item.customer_id
                ? "Cliente Removido"
                : "Não informado";
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
            valorNum: valorNum,
            comissaoNum: comissaoItemVal,
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
      await atualizarComissaoProfissional(profId, valorLimpo);
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

  const gerarRelatorioPDF = (profId) => {
    const prof = funcionarias.find((f) => f.id === profId);
    if (!prof) return;

    const atendimentos = atendimentosPorProfissional[profId] || [];

    // 1. Calcula o período de atendimento/venda formatado
    let periodoFormatado = "";
    const anoNum = Number(anoSelecionado);

    if (filtroDesempenho === "semana") {
      const hoje = new Date();
      const diaSemana = hoje.getDay();
      const dataDom = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - diaSemana);
      const dataSab = new Date(dataDom.getFullYear(), dataDom.getMonth(), dataDom.getDate() + 6);
      const dInicio = `${String(dataDom.getDate()).padStart(2, "0")}/${String(dataDom.getMonth() + 1).padStart(2, "0")}/${dataDom.getFullYear()}`;
      const dFim = `${String(dataSab.getDate()).padStart(2, "0")}/${String(dataSab.getMonth() + 1).padStart(2, "0")}/${dataSab.getFullYear()}`;
      periodoFormatado = `${dInicio} a ${dFim}`;
    } else {
      if (mesSelecionado === "Ano") {
        periodoFormatado = `01/01/${anoNum} a 31/12/${anoNum}`;
      } else {
        const mesIndex = meses.indexOf(mesSelecionado);
        const mesFormatado = String(mesIndex + 1).padStart(2, "0");
        const ultimoDiaMes = new Date(anoNum, mesIndex + 1, 0).getDate();
        periodoFormatado = `01/${mesFormatado}/${anoNum} a ${String(ultimoDiaMes).padStart(2, "0")}/${mesFormatado}/${anoNum}`;
      }
    }

    // 2. Agrupa os atendimentos por serviço para o descritivo
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
      `
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
          .titulo-empresa {
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 18px;
            color: #000000;
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
      alert("Por favor, permita popups para gerar e imprimir o PDF.");
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
              disabled={loading} // Trava a busca enquanto carrega
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
          <button
            onClick={() => {
              setVendaEditando(null);
              setIsModalAvulsoOpen(true);
            }}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s",
              border: "none",
              backgroundColor: "#22C55E",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Plus size={16} /> Nova Venda
          </button>
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
                <div className="prof-detalhes-header">
                  <div className="prof-detalhes-header-info">
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

                  <div className="prof-detalhes-header-acoes">
                    <button
                      type="button"
                      onClick={() => gerarRelatorioPDF(profSelecionada)}
                      className="btn-gerar-relatorio-pdf"
                      title="Gerar e Imprimir Relatório em PDF"
                    >
                      <FileText size={16} />
                      <span>Gerar Relatório PDF</span>
                    </button>

                    {profile?.is_admin && (
                      <button
                        className="btn-fechar"
                        onClick={() => setProfSelecionada(null)}
                        title="Fechar histórico"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
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
                  <span>Serviço / Item</span>
                  <span>Forma de Pagto.</span>
                  <span>Data</span>
                  <span>Valor</span>
                  <span style={{ textAlign: "center" }}>Ações</span>
                </div>
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={`skel-historico-${item}`}
                    className="tabela-linha geral-table"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.5fr 1.8fr 1fr 1fr 1fr 80px",
                      alignItems: "center",
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
              <div className="tabela-financeira">
                <div className="tabela-cabecalho geral-table">
                  <span>Cliente</span>
                  <span>Serviço / Item</span>
                  <span>Forma de Pagto.</span>
                  <span>Data</span>
                  <span>Valor</span>
                  <span style={{ textAlign: "center" }}>Ações</span>
                </div>
                {historicoPaginado.map((item) => (
                  <div key={item.id} className="tabela-linha geral-table">
                    <strong>{item.cliente}</strong>
                    <div className="celula-servico-venda">
                      {item.isVenda && (
                        <span className="badge-venda-item">
                          <ShoppingBag size={12} /> Venda
                        </span>
                      )}
                      <span className="texto-secundario">{item.servico}</span>
                    </div>
                    <span>
                      <span className="tag-forma">{item.forma}</span>
                    </span>
                    <span className="texto-secundario">{item.data}</span>
                    <span className="valor-recebido">{item.valor}</span>
                    <div className="acoes-tabela-venda">
                      {item.isVenda ? (
                        <>
                          <button
                            type="button"
                            className="btn-acao-tabela btn-editar-venda"
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
                            className="btn-acao-tabela btn-excluir-venda"
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
                        <span className="texto-secundario" style={{ opacity: 0.4 }}>-</span>
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
              <div className="estado-vazio">
                <Calendar size={40} />
                <p>Nenhum recebimento registrado para este período.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE CRIAÇÃO E EDIÇÃO DE VENDA */}
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
          carregarMetricasGerais();
          carregarDesempenhoEquipe();
        }}
      />

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE VENDA */}
      {vendaParaExcluir && (
        <div
          className="modal-overlay"
          onClick={() => !isExcluindoVenda && setVendaParaExcluir(null)}
        >
          <div
            className="modal-box modal-exclusao-venda-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-titulo-wrapper">
                <div className="modal-header-icone icone-excluir-venda">
                  <Trash2 size={20} />
                </div>
                <h2>Excluir Venda</h2>
              </div>
              <button
                className="btn-fechar"
                onClick={() => setVendaParaExcluir(null)}
                disabled={isExcluindoVenda}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-exclusao-venda-conteudo">
              <p className="texto-aviso-exclusao">
                Tem certeza que deseja excluir esta venda de{" "}
                <strong>"{vendaParaExcluir.servico}"</strong> no valor de{" "}
                <strong>{vendaParaExcluir.valor}</strong>?
              </p>
              <div className="box-alerta-estoque-devolucao">
                <AlertCircle size={18} className="icone-alerta-devolucao" />
                <span>
                  O valor será debitado do faturamento e as unidades vendidas serão{" "}
                  <strong>devolvidas ao estoque do produto</strong>.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancelar"
                onClick={() => setVendaParaExcluir(null)}
                disabled={isExcluindoVenda}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-confirmar-exclusao-final"
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
