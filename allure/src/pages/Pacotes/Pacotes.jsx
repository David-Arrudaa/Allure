import { useState, useEffect } from "react";
import { Package, Plus, Trash2, X, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";
import { toast } from "../../lib/toast";

export function Pacotes() {
  const { profile, user } = useAuth();
  const tenantId = profile?.tenant_id || user?.tenant_id;

  const [pacotes, setPacotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Form states
  const [nome, setNome] = useState("");
  const [quantidadeSessoes, setQuantidadeSessoes] = useState("5");
  const [valorTexto, setValorTexto] = useState("");

  const carregarPacotes = async () => {
    if (!tenantId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pacotes")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("nome", { ascending: true });

      if (error) throw error;
      setPacotes(data || []);
    } catch (err) {
      console.error("Erro ao carregar pacotes:", err);
      toast.error("Não foi possível carregar os pacotes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPacotes();
  }, [tenantId]);

  const handleSalvarPacote = async (e) => {
    e.preventDefault();
    if (!tenantId) return;

    if (!nome.trim()) {
      toast.error("Informe o nome do pacote.");
      return;
    }

    const sessoesNum = parseInt(quantidadeSessoes, 10);
    if (isNaN(sessoesNum) || sessoesNum <= 0) {
      toast.error("Informe uma quantidade válida de sessões.");
      return;
    }

    const valorNum = Number(String(valorTexto).replace(",", "."));
    if (isNaN(valorNum) || valorNum <= 0) {
      toast.error("Informe o valor do pacote.");
      return;
    }

    try {
      setSalvando(true);
      const { error } = await supabase.from("pacotes").insert([
        {
          tenant_id: tenantId,
          nome: nome.trim(),
          quantidade_sessoes: sessoesNum,
          valor: valorNum,
        },
      ]);

      if (error) throw error;

      toast.success("Pacote criado com sucesso!");
      setNome("");
      setQuantidadeSessoes("5");
      setValorTexto("");
      setModalAberto(false);
      carregarPacotes();
    } catch (err) {
      console.error("Erro ao salvar pacote:", err);
      toast.error("Erro ao criar pacote. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirPacote = async (id, nomePacote) => {
    if (!window.confirm(`Tem certeza que deseja apagar o pacote "${nomePacote}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("pacotes")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
      toast.success("Pacote removido com sucesso!");
      carregarPacotes();
    } catch (err) {
      console.error("Erro ao excluir pacote:", err);
      toast.error("Não foi possível excluir o pacote.");
    }
  };

  const formatarMoeda = (val) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      Number(val) || 0
    );

  return (
    <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-7 h-7 text-purple-600" />
              Gestão de Pacotes
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Crie pacotes e planos de sessões para fidelizar clientes e antecipar receita
            </p>
          </div>

          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Pacote
          </button>
        </div>

        {/* CONTEÚDO */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">
            Carregando pacotes cadastrados...
          </div>
        ) : pacotes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 text-base font-semibold text-slate-800">
              Nenhum pacote cadastrado
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Crie pacotes de sessões (ex: 5 Drenagens ou 10 Escovas) para vender com desconto e garantir fluxo de caixa antecipado.
            </p>
            <button
              onClick={() => setModalAberto(true)}
              className="mt-5 inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-100 text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Pacote
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pacotes.map((p) => {
              const valorPorSessao =
                p.quantidade_sessoes > 0 ? Number(p.valor || 0) / p.quantidade_sessoes : 0;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-slate-800 text-base leading-snug">
                        {p.nome}
                      </h3>
                      {profile?.is_admin && (
                        <button
                          onClick={() => handleExcluirPacote(p.id, p.nome)}
                          className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                          title="Excluir pacote"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-2xl font-extrabold text-purple-700">
                        {formatarMoeda(p.valor)}
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-semibold">
                        {p.quantidade_sessoes} sessões
                      </span>
                      <span>({formatarMoeda(valorPorSessao)} por sessão)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL NOVO PACOTE */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Novo Pacote de Sessões</h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarPacote} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Nome do Pacote *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Combo 5 Drenagens Linfáticas"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Qtd. de Sessões *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 5"
                    value={quantidadeSessoes}
                    onChange={(e) => setQuantidadeSessoes(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Valor Total (R$) *
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 350,00"
                    value={valorTexto}
                    onChange={(e) => setValorTexto(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-1.5"
                >
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : null}
                  {salvando ? "Salvando..." : "Salvar Pacote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
