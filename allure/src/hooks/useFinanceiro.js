import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPagamentosPeriodo,
  fetchComissaoProfissional,
  fetchDesempenhoPeriodo,
  atualizarComissaoProfissional,
  buscarProdutoPorNome,
  ajustarEstoqueProduto,
  excluirVendaAvulsa,
} from "../services/financeiroService";
import { excluirVendaAvulsa as excluirVendaNormalizada } from "../services/transacoesService";

export const METRICAS_VAZIAS = {
  total: 0,
  pix: 0,
  dinheiro: 0,
  cartao: 0,
  comissao: 0,
  comissaoTaxa: 50,
};

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

export function useFinanceiroMetricas({
  inicioFiltro,
  fimFiltro,
  profile,
  busca = "",
  filtroFuncionariaGeral = "",
}) {
  return useQuery({
    queryKey: [
      "financeiro-metricas",
      inicioFiltro,
      fimFiltro,
      profile?.id,
      profile?.is_admin,
      busca,
      filtroFuncionariaGeral,
    ],
    queryFn: async () => {
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
                ? "—"
                : "Não informado";

          if (busca && !clienteNome.toLowerCase().includes(busca.toLowerCase()))
            return;

          if (
            filtroFuncionariaGeral &&
            item.profissionais?.id !== filtroFuncionariaGeral
          )
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
            transacao_id: item.transacao_id,
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

      return {
        metricas: {
          total: sumTotal,
          pix: sumPix,
          dinheiro: sumDinheiro,
          cartao: sumCartao,
          comissao: comissaoTotal,
          comissaoTaxa: taxaComissaoProf,
        },
        historicoPagamentos: historicoGeral,
      };
    },
    enabled: Boolean(inicioFiltro && fimFiltro),
  });
}

export function useFinanceiroDesempenho({
  inicioFiltro,
  fimFiltro,
  profile,
  busca = "",
}) {
  return useQuery({
    queryKey: [
      "financeiro-desempenho",
      inicioFiltro,
      fimFiltro,
      profile?.id,
      profile?.is_admin,
      busca,
    ],
    queryFn: async () => {
      const data = await fetchDesempenhoPeriodo({
        inicioFiltro,
        fimFiltro,
        apenasProfissionalId:
          !profile?.is_admin && profile?.id ? profile.id : null,
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
                ? "—"
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

      return {
        funcionarias: arrayFuncionarias,
        atendimentosPorProfissional: mapaAtendimentos,
      };
    },
    enabled: Boolean(inicioFiltro && fimFiltro),
  });
}

export function useFinanceiroMutations() {
  const queryClient = useQueryClient();

  const invalidarTudo = () => {
    queryClient.invalidateQueries({ queryKey: ["financeiro-metricas"] });
    queryClient.invalidateQueries({ queryKey: ["financeiro-desempenho"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const excluirVendaMutation = useMutation({
    mutationFn: async ({ vendaParaExcluir, tenantId }) => {
      if (vendaParaExcluir.transacao_id && tenantId) {
        await excluirVendaNormalizada({
          transacaoId: vendaParaExcluir.transacao_id,
          tenantId,
        });
      } else {
        if (vendaParaExcluir.servico && tenantId) {
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
                await ajustarEstoqueProduto(
                  prods.id,
                  tenantId,
                  estoqueAtual + qtd,
                );
              } catch (errEstoque) {
                console.warn(
                  "Falha ao ajustar estoque (não-bloqueante):",
                  errEstoque.message,
                );
              }
            }
          }
        }
        await excluirVendaAvulsa(vendaParaExcluir.id);
      }
    },
    onSuccess: invalidarTudo,
  });

  const atualizarComissaoMutation = useMutation({
    mutationFn: async ({ profId, novoValor }) => {
      if (!profId || profId === "sem-prof") return;
      let valorLimpo = Number(novoValor);
      if (valorLimpo < 0) valorLimpo = 0;
      if (valorLimpo > 100) valorLimpo = 100;
      await atualizarComissaoProfissional(profId, valorLimpo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeiro-desempenho"] });
      queryClient.invalidateQueries({ queryKey: ["financeiro-metricas"] });
    },
  });

  return {
    excluirVenda: excluirVendaMutation.mutateAsync,
    isExcluindoVenda: excluirVendaMutation.isPending,
    atualizarComissao: atualizarComissaoMutation.mutateAsync,
    invalidarFinanceiro: invalidarTudo,
  };
}
