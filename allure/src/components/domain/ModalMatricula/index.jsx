import { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Search,
  DollarSign,
  CreditCard,
  CheckCircle2,
  Phone,
  AlertCircle,
} from "lucide-react";
import { toast } from "../../../lib/toast";
import { buscarClientesParaMatricula } from "../../../services/cursosService";

export function ModalMatricula({
  isOpen,
  onClose,
  turma,
  onMatricular,
  isSalvando,
  tenantId,
}) {
  const [modo, setModo] = useState("existente"); // 'existente' | 'nova'
  const [busca, setBusca] = useState("");
  const [clientesEncontrados, setClientesEncontrados] = useState([]);
  const [clienteSelecionada, setClienteSelecionada] = useState(null);
  const [buscando, setBuscando] = useState(false);

  // Campos Nova Aluna
  const [novoNome, setNovoNome] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");

  // Dados da Matrícula
  const [valorAcordado, setValorAcordado] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Pagamento Inicial Opcional
  const [registrarPagamento, setRegistrarPagamento] = useState(true);
  const [valorPagamento, setValorPagamento] = useState("");
  const [tipoLancamento, setTipoLancamento] = useState("sinal"); // 'sinal' | 'integral'
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [dataPagamento, setDataPagamento] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (isOpen && turma) {
      setValorAcordado(
        turma.valor_turma ? String(turma.valor_turma).replace(".", ",") : ""
      );
      setValorPagamento("");
      setRegistrarPagamento(true);
      setTipoLancamento("sinal");
      setFormaPagamento("Pix");
      setDataPagamento(new Date().toISOString().split("T")[0]);
      setModo("existente");
      setBusca("");
      setClientesEncontrados([]);
      setClienteSelecionada(null);
      setNovoNome("");
      setNovoTelefone("");
      setObservacoes("");
    }
  }, [isOpen, turma]);

  // Busca rápida de clientes existentes
  useEffect(() => {
    if (modo !== "existente" || busca.trim().length < 2) {
      setClientesEncontrados([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setBuscando(true);
        const res = await buscarClientesParaMatricula(busca);
        setClientesEncontrados(res);
      } catch (err) {
        console.error("Erro ao buscar clientes:", err);
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [busca, modo]);

  if (!isOpen || !turma) return null;

  const aplicarMascaraTelefone = (v) => {
    const limpo = v.replace(/\D/g, "");
    if (limpo.length <= 2) return limpo;
    if (limpo.length <= 6) return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`;
    if (limpo.length <= 10)
      return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7, 11)}`;
  };

  const handleSubmeter = async (e) => {
    e.preventDefault();

    if (modo === "existente" && !clienteSelecionada) {
      toast.error("Por favor, selecione uma aluna na lista de busca.");
      return;
    }

    if (modo === "nova" && (!novoNome.trim() || novoNome.trim().length < 3)) {
      toast.error("Informe o nome completo da nova aluna.");
      return;
    }

    const vAcordadoNum = valorAcordado
      ? Number(valorAcordado.replace(/\./g, "").replace(",", "."))
      : 0;

    let payloadPagamento = null;
    if (registrarPagamento) {
      const vPagamentoNum = valorPagamento
        ? Number(valorPagamento.replace(/\./g, "").replace(",", "."))
        : 0;

      if (vPagamentoNum > 0) {
        payloadPagamento = {
          valor: vPagamentoNum,
          formaPagamento,
          tipoLancamento,
          dataPagamento,
        };
      }
    }

    try {
      await onMatricular({
        tenantId,
        turmaId: turma.id,
        customerId: modo === "existente" ? clienteSelecionada.id : null,
        novaAluna:
          modo === "nova"
            ? { nome: novoNome.trim(), telefone: novoTelefone.trim() }
            : null,
        valorAcordado: vAcordadoNum,
        observacoes: observacoes.trim(),
        primeiroPagamento: payloadPagamento,
      });

      toast.success("Aluna matriculada com sucesso!");
      onClose();
    } catch (err) {
      console.error("Erro ao matricular:", err);
      if (err.message?.includes("uq_matricula_turma_customer")) {
        toast.error("Esta aluna já está matriculada nesta turma.");
      } else {
        toast.error(err.message || "Erro ao realizar matrícula.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <UserPlus size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Matricular Aluna
              </h3>
              <p className="text-xs text-slate-500">
                {turma.curso?.nome} &bull; {turma.identificador}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmeter} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Seletor de Modo: Cliente existente vs Nova Aluna */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Origem do Cadastro
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setModo("existente")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition ${
                  modo === "existente"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Buscar na Base de Clientes
              </button>
              <button
                type="button"
                onClick={() => setModo("nova")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg transition ${
                  modo === "nova"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Cadastrar Nova Aluna
              </button>
            </div>
          </div>

          {/* MODO 1: Buscar Cliente Existente */}
          {modo === "existente" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Pesquisar Aluna / Cliente *
              </label>
              {clienteSelecionada ? (
                <div className="flex items-center justify-between p-3 rounded-xl border border-purple-200 bg-purple-50/50">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {clienteSelecionada.nome}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {clienteSelecionada.telefone || "Sem telefone cadastrado"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setClienteSelecionada(null);
                      setBusca("");
                    }}
                    className="text-xs text-purple-600 font-semibold hover:underline"
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Digite nome ou telefone da cliente..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {buscando && (
                    <p className="text-xs text-slate-400 mt-1 pl-1">Buscando...</p>
                  )}

                  {clientesEncontrados.length > 0 && !clienteSelecionada && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {clientesEncontrados.map((cli) => (
                        <button
                          key={cli.id}
                          type="button"
                          onClick={() => {
                            setClienteSelecionada(cli);
                            setClientesEncontrados([]);
                          }}
                          className="w-full text-left p-2.5 hover:bg-purple-50 transition flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {cli.nome}
                            </p>
                            <p className="text-xs text-slate-500">
                              {cli.telefone || "Sem telefone"}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-purple-600">
                            Selecionar
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {busca.trim().length >= 2 &&
                    !buscando &&
                    clientesEncontrados.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                        <AlertCircle size={13} />
                        Nenhuma cliente encontrada. Você pode alternar para a aba
                        "Cadastrar Nova Aluna" acima.
                      </p>
                    )}
                </div>
              )}
            </div>
          ) : (
            /* MODO 2: Cadastrar Nova Aluna */
            <div className="space-y-3 bg-purple-50/40 p-3.5 rounded-xl border border-purple-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nome Completo da Aluna *
                </label>
                <input
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Amanda Ferreira da Silva"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Phone size={12} className="text-slate-400" />
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={novoTelefone}
                  onChange={(e) =>
                    setNovoTelefone(aplicarMascaraTelefone(e.target.value))
                  }
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  A aluna será salva automaticamente na base geral de clientes do salão.
                </span>
              </div>
            </div>
          )}

          {/* Valor Acordado da Matrícula */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <DollarSign size={13} className="text-slate-400" />
              Valor Total do Curso para esta Aluna (R$) *
            </label>
            <input
              type="text"
              value={valorAcordado}
              onChange={(e) => setValorAcordado(e.target.value)}
              placeholder="Ex: 1.500,00"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Seção de Pagamento Inicial / Sinal */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={registrarPagamento}
                  onChange={(e) => setRegistrarPagamento(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Registrar Pagamento / Sinal Agora
                </span>
              </label>
            </div>

            {registrarPagamento && (
              <div className="space-y-3 pt-2 border-t border-slate-200/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Valor Recebido (R$) *
                    </label>
                    <input
                      type="text"
                      value={valorPagamento}
                      onChange={(e) => setValorPagamento(e.target.value)}
                      placeholder="Ex: 300,00"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Tipo de Lançamento
                    </label>
                    <select
                      value={tipoLancamento}
                      onChange={(e) => setTipoLancamento(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="sinal">Sinal (Entrada)</option>
                      <option value="integral">Valor Integral (Quitado)</option>
                      <option value="avulso">Parcela Avulsa</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                      <CreditCard size={12} className="text-slate-400" />
                      Forma de Pagamento
                    </label>
                    <select
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Pix">Pix</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Data do Pagamento
                    </label>
                    <input
                      type="date"
                      value={dataPagamento}
                      onChange={(e) => setDataPagamento(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Observações da Matrícula */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Observações (Opcional)
            </label>
            <textarea
              rows="2"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Combinado pagar o restante no 1º dia de aula..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSalvando}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSalvando}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 size={16} />
              {isSalvando ? "Matriculando..." : "Confirmar Matrícula"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

