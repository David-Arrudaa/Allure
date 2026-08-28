import { useState, useEffect } from "react";
import { RefreshCw, AlertTriangle, ListChecks } from "lucide-react";
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModalConfirmacaoRetroativo } from "../ModalConfirmacaoRetroativo";
import { Modal } from "../../ui/Modal";
import Button from "../../ui/Button";
import "./ModalAgendamento.css";

const agendamentoSchema = z.object({
  cliente: z.string().min(3, "Nome da cliente deve ter no mínimo 3 caracteres").max(255, "Máximo de 255 caracteres").optional(),
  dataAgendamento: z.string(),
  horario: z.string(),
  profissionalId: z.string().min(1, "Selecione o profissional"),
  servico: z.string().optional(),
  duracao: z.number().min(1, "Duração inválida"),
  valor: z.string().optional()
});

const extrairAniversario = (observacoes) => {
  if (!observacoes) return "";
  const match = observacoes.match(/(?:Nascimento|Anivers[áa]rio):\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4})/i);
  if (match) {
    const val = match[1];
    if (val.includes("/")) {
      const [d, m, y] = val.split("/");
      return `${y}-${m}-${d}`;
    }
    return val;
  }
  return "";
};

const applyPhoneMask = (value) => {
  if (!value) return "";
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 2) return clean;
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
};

export function ModalAgendamento({ isOpen, onClose, agendamento, onSave }) {
  const { profile } = useAuth();

  const [buscaCliente, setBuscaCliente] = useState("");
  const [listaClientesBanco, setListaClientesBanco] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [isBuscando, setIsBuscando] = useState(false);
  const [digitandoPeloUsuario, setDigitandoPeloUsuario] = useState(false);

  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [eWhatsApp, setEWhatsApp] = useState(true);
  const [aniversarioCliente, setAniversarioCliente] = useState("");

  const [profissionais, setProfissionais] = useState([]);
  const [profissionalId, setProfissionalId] = useState("");

  const [servicos, setServicos] = useState([]);
  const [servico, setServico] = useState("");

  const [horario, setHorario] = useState("09:00");
  const [duracao, setDuracao] = useState(60);
  const [valor, setValor] = useState("");
  const [dataAgendamento, setDataAgendamento] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [isRecorrente, setIsRecorrente] = useState(false);
  const [tipoRecorrencia, setTipoRecorrencia] = useState("semanal");
  const [dataFim, setDataFim] = useState("");

  const [isBloqueio, setIsBloqueio] = useState(false);

  const [showModalRetroativo, setShowModalRetroativo] = useState(false);
  const [pacotesParaSalvarModal, setPacotesParaSalvarModal] = useState(null);

  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState({});
  const [conflitosDetalhados, setConflitosDetalhados] = useState([]);
  const [pacotesPendentes, setPacotesPendentes] = useState([]);

  const [isSaving, setIsSaving] = useState(false);

  const { handleSubmit } = useForm({
    resolver: zodResolver(agendamentoSchema)
  });

  useEffect(() => {
    if (isOpen) {
      carregarProfissionais();
      carregarServicos();

      if (agendamento) {
        setBuscaCliente(agendamento.cliente || "");
        if (agendamento.clienteId) {
          setClienteSelecionado({ id: agendamento.clienteId, nome: agendamento.cliente });
        } else {
          setClienteSelecionado(null);
        }

        setTelefoneCliente(agendamento.telefone ? applyPhoneMask(agendamento.telefone) : "");
        setEWhatsApp(agendamento.is_whatsapp ?? true);
        setAniversarioCliente(agendamento.aniversario || "");

        setProfissionalId(agendamento.profissionalId || "");
        setServico(agendamento.servico || "");

        if (agendamento.duracao) setDuracao(agendamento.duracao);
        if (agendamento.valor) setValor(String(agendamento.valor).replace(".", ","));
        if (agendamento.horarioInicio) setHorario(agendamento.horarioInicio);
        if (agendamento.data) setDataAgendamento(agendamento.data);

        const ehBloqueio = agendamento.servico === "Pausa" || agendamento.servico === "Bloqueio";
        setIsBloqueio(ehBloqueio);

        setIsRecorrente(false);
        setDataFim("");
      } else {
        resetForm();
      }
    }
  }, [agendamento, isOpen]);

  useEffect(() => {
    if (!isOpen || !digitandoPeloUsuario || buscaCliente.trim().length < 2) {
      setListaClientesBanco([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsBuscando(true);
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, nome, telefone, is_whatsapp, observacoes")
          .ilike("nome", `%${buscaCliente.trim()}%`)
          .limit(5);

        if (!error && data) {
          setListaClientesBanco(data);
        }
      } catch (err) {
        console.error("Erro ao buscar clientes no banco:", err);
      } finally {
        setIsBuscando(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [buscaCliente, digitandoPeloUsuario, isOpen]);

  const resetForm = () => {
    setBuscaCliente("");
    setClienteSelecionado(null);
    setListaClientesBanco([]);
    setDigitandoPeloUsuario(false);
    setTelefoneCliente("");
    setEWhatsApp(true);
    setAniversarioCliente("");

    if (profissionais.length > 0) {
      setProfissionalId(profissionais[0].id);
    }
    setServico("");
    setHorario("09:00");
    setDuracao(60);
    setValor("");
    setDataAgendamento(new Date().toISOString().split("T")[0]);
    setIsRecorrente(false);
    setTipoRecorrencia("semanal");
    setDataFim("");
    setIsBloqueio(false);
    setIsSaving(false);
  };

  const carregarProfissionais = async () => {
    try {
      const { data, error } = await supabase
        .from("profissionais")
        .select("id, nome")
        .order("ordem", { ascending: true })
        .order("nome", { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setProfissionais(data);
        if (!agendamento && !profissionalId) {
          setProfissionalId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar profissionais:", err.message);
    }
  };

  const carregarServicos = async () => {
    try {
      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome, preco")
        .order("nome", { ascending: true });

      if (error) throw error;
      if (data) {
        setServicos(data);
      }
    } catch (err) {
      console.error("Erro ao carregar serviços:", err.message);
    }
  };

  const handleServicoChange = (e) => {
    const nomeServico = e.target.value;
    setServico(nomeServico);

    const sEncontrado = servicos.find((s) => s.nome === nomeServico);
    if (sEncontrado && sEncontrado.preco) {
      setValor(String(sEncontrado.preco).replace(".", ","));
    }
  };

  const prepararSalvamento = async () => {
    if (isSaving) return;

    if (!isBloqueio && !buscaCliente.trim()) {
      alert("Por favor, preencha o nome da cliente.");
      return;
    }
    if (!profissionalId) {
      alert("Por favor, selecione um profissional.");
      return;
    }
    if (!isBloqueio && !servico) {
      alert("Por favor, escolha um serviço ou selecione Pausa.");
      return;
    }

    setIsSaving(true);

    try {
      let customerIdFinal = clienteSelecionado ? clienteSelecionado.id : null;

      if (!isBloqueio && !customerIdFinal && buscaCliente.trim()) {
        const nomeFormatado = buscaCliente.trim().toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
        const obsFinal = aniversarioCliente ? `Nascimento: ${aniversarioCliente}` : null;

        const tenantIdFinal = profile?.tenant_id || "11111111-1111-1111-1111-111111111111";

        const { data: novocliente, error: errCliente } = await supabase
          .from("customers")
          .insert([
            {
              nome: nomeFormatado,
              telefone: telefoneCliente.trim() || null,
              is_whatsapp: eWhatsApp,
              observacoes: obsFinal,
              tenant_id: tenantIdFinal,
            },
          ])
          .select()
          .single();

        if (errCliente) throw errCliente;
        if (novocliente) customerIdFinal = novocliente.id;
      }

      const pacotes = [];

      if (!isRecorrente) {
        pacotes.push({
          dataStr: dataAgendamento,
          horaStr: horario,
          customerId: customerIdFinal,
        });
      } else {
        if (!dataFim) {
          alert("Selecione a data final da série de agendamentos.");
          setIsSaving(false);
          return;
        }

        let atual = new Date(`${dataAgendamento.replace(/-/g, "/")}T${horario}:00`);
        const limite = new Date(`${dataFim.replace(/-/g, "/")}T${horario}:00`);

        if (limite <= atual) {
          alert("A data final deve ser posterior à data inicial.");
          setIsSaving(false);
          return;
        }

        const passoDias = tipoRecorrencia === "semanal" ? 7 : 14;

        while (atual <= limite) {
          const ano = atual.getFullYear();
          const mes = String(atual.getMonth() + 1).padStart(2, "0");
          const dia = String(atual.getDate()).padStart(2, "0");
          const dStr = `${ano}-${mes}-${dia}`;

          const hStr = `${String(atual.getHours()).padStart(2, "0")}:${String(atual.getMinutes()).padStart(2, "0")}`;

          pacotes.push({
            dataStr: dStr,
            horaStr: hStr,
            customerId: customerIdFinal,
          });

          atual.setDate(atual.getDate() + passoDias);
        }
      }

      validarESalvar(pacotes);
    } catch (err) {
      console.error("Erro ao preparar salvamento:", err);
      alert("Erro ao preparar dados: " + (err.message || err));
      setIsSaving(false);
    }
  };

  const validarESalvar = async (pacotes) => {
    try {
      const duracaoNum = Number(duracao) || 60;
      const profObj = profissionais.find((p) => String(p.id) === String(profissionalId));
      const profNome = profObj ? profObj.nome : "O profissional";

      const conflitosEncontrados = [];

      for (let p of pacotes) {
        const inicioSugerido = new Date(`${p.dataStr.replace(/-/g, "/")}T${p.horaStr}:00`);
        const fimSugerido = new Date(inicioSugerido.getTime() + duracaoNum * 60000);

        const inicioIso = new Date(inicioSugerido.getTime() - 4 * 3600000).toISOString();
        const fimIso = new Date(fimSugerido.getTime() + 4 * 3600000).toISOString();

        const { data: agsNoDia } = await supabase
          .from("appointments")
          .select("id, data_horario, duracao, status")
          .eq("profissional_id", profissionalId)
          .gte("data_horario", inicioIso)
          .lte("data_horario", fimIso);

        if (agsNoDia) {
          for (let ag of agsNoDia) {
            if (agendamento && String(ag.id) === String(agendamento.id)) continue;
            if (ag.status === "cancelado") continue;

            const agInicio = new Date(ag.data_horario);
            const agDuracao = Number(ag.duracao) || 60;
            const agFim = new Date(agInicio.getTime() + agDuracao * 60000);

            if (inicioSugerido < agFim && fimSugerido > agInicio) {
              conflitosEncontrados.push({
                dataStr: p.dataStr,
                horarioAtual: p.horaStr,
                novoHorario: p.horaStr,
                horarioConflito: `${String(agInicio.getHours()).padStart(2, "0")}:${String(agInicio.getMinutes()).padStart(2, "0")}`,
              });
              break;
            }
          }
        }
      }

      if (conflitosEncontrados.length > 0) {
        if (!isRecorrente) {
          setConflictInfo({
            tipo: "conflito_unico",
            profissionalNome: profNome,
            horario: conflitosEncontrados[0].horarioConflito,
          });
        } else {
          setConflictInfo({
            tipo: "conflito_multiplo",
            profissionalNome: profNome,
          });
          setConflitosDetalhados(conflitosEncontrados);
          setPacotesPendentes(pacotes);
        }
        setShowConflictModal(true);
        setIsSaving(false);
        return;
      }

      let contemRetroativo = false;
      const agora = new Date();

      for (let p of pacotes) {
        const dataHoraObj = new Date(`${p.dataStr.replace(/-/g, "/")}T${p.horaStr}:00`);
        if (dataHoraObj < agora) {
          contemRetroativo = true;
          break;
        }
      }

      if (contemRetroativo && !agendamento) {
        setPacotesParaSalvarModal(pacotes);
        setShowModalRetroativo(true);
        setIsSaving(false);
        return;
      }

      await executarInsercaoNoBanco(pacotes, false);
    } catch (err) {
      console.error("Erro na validação:", err);
      alert("Erro ao validar horário: " + (err.message || err));
      setIsSaving(false);
    }
  };

  const handleConfirmarRetroativo = async () => {
    setShowModalRetroativo(false);
    if (pacotesParaSalvarModal) {
      setIsSaving(true);
      await executarInsercaoNoBanco(pacotesParaSalvarModal, true);
    }
  };

  const handleCancelarRetroativo = () => {
    setShowModalRetroativo(false);
    setIsSaving(false);
  };

  const executarInsercaoNoBanco = async (pacotes, isRetroativo = false) => {
    try {
      const valorLimpo = valor ? Number(valor.replace(",", ".")) : 0;
      const duracaoNum = Number(duracao) || 60;
      const servicoFinal = isBloqueio ? "Pausa" : servico;
      const statusFinal = isRetroativo ? "concluido" : agendamento ? agendamento.status || "confirmado" : "confirmado";
      const pagamentoFinal = isRetroativo ? "pago" : agendamento ? agendamento.pagamento || "pendente" : "pendente";

      const grupoRecorrenciaId = isRecorrente ? crypto.randomUUID() : agendamento?.grupo_recorrencia || null;

      const tenantIdFinal = profile?.tenant_id || "11111111-1111-1111-1111-111111111111";

      const pacotesSalvarBanco = pacotes.map((p) => {
        const isoString = `${p.dataStr}T${p.horaStr}:00-03:00`;

        return {
          customer_id: p.customerId,
          profissional_id: profissionalId,
          servico: servicoFinal,
          duracao: duracaoNum,
          valor: valorLimpo,
          data_horario: isoString,
          status: statusFinal,
          pagamento: pagamentoFinal,
          grupo_recorrencia: grupoRecorrenciaId,
          tenant_id: tenantIdFinal,
        };
      });

      let resSalvar;
      if (agendamento && agendamento.id) {
        resSalvar = await supabase
          .from("appointments")
          .update(pacotesSalvarBanco[0])
          .eq("id", agendamento.id);
      } else {
        resSalvar = await supabase
          .from("appointments")
          .insert(pacotesSalvarBanco);
      }

      if (resSalvar && resSalvar.error) throw resSalvar.error;

      if (onSave) onSave();
      onClose();
    } catch (err) {
      console.error("Erro ao salvar agendamento:", err);
      alert("Erro ao salvar agendamento: " + (err.message || err));
      setIsSaving(false);
    }
  };

  const handleResolverConflitosEmLote = () => {
    setIsSaving(true);
    const pacotesAtualizados = pacotesPendentes.map((p) => {
      const conflitoResolvido = conflitosDetalhados.find(
        (c) => c.dataStr === p.dataStr && c.horarioAtual === p.horaStr,
      );
      if (conflitoResolvido) {
        return { ...p, horaStr: conflitoResolvido.novoHorario };
      }
      return p;
    });
    validarESalvar(pacotesAtualizados);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agendamento ? "Editar Agendamento" : "Novo Agendamento"}
    >
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer font-medium select-none">
          <input
            type="checkbox"
            checked={isBloqueio}
            onChange={(e) => {
              setIsBloqueio(e.target.checked);
              if (e.target.checked) {
                setClienteSelecionado(null);
                setBuscaCliente("");
                setServico("Pausa");
                setValor("0,00");
              }
            }}
            className="rounded text-[var(--cor-primaria)] cursor-pointer"
          />
          Pausa
        </label>
      </div>

      <form onSubmit={handleSubmit(prepararSalvamento)} className="space-y-4">
        <div className="flex flex-col gap-1.5 relative">
          <label className="text-sm font-semibold text-slate-700">
            {isBloqueio ? "Motivo do Bloqueio" : "Nome da Cliente"}
          </label>
          <input
            type="text"
            placeholder={
              isBloqueio
                ? "Ex: Almoço, Reunião..."
                : "Digite o nome da cliente..."
            }
            value={
              clienteSelecionado ? clienteSelecionado.nome : buscaCliente
            }
            onFocus={() => {
              if (buscaCliente.trim().length >= 2) setDigitandoPeloUsuario(true);
            }}
            onBlur={() => {
              setTimeout(() => setDigitandoPeloUsuario(false), 200);
            }}
            onChange={(e) => {
              setDigitandoPeloUsuario(true);
              setBuscaCliente(e.target.value);
              setClienteSelecionado(null);
            }}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)]"
          />

          {!isBloqueio &&
            digitandoPeloUsuario &&
            buscaCliente.trim().length >= 2 &&
            !clienteSelecionado && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto mt-1" onMouseDown={(e) => e.preventDefault()}>
                {isBuscando ? (
                  <div className="p-3 text-xs text-slate-500 text-center italic">
                    Buscando...
                  </div>
                ) : listaClientesBanco.length > 0 ? (
                  listaClientesBanco.map((c) => {
                    const niver = extrairAniversario(c.observacoes);
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setClienteSelecionado(c);
                          setBuscaCliente(c.nome);
                          setTelefoneCliente(c.telefone ? applyPhoneMask(c.telefone) : "");
                          setEWhatsApp(c.is_whatsapp ?? true);
                          setAniversarioCliente(niver || "");
                          setListaClientesBanco([]);
                          setDigitandoPeloUsuario(false);
                        }}
                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 text-xs text-slate-700"
                      >
                        <strong>{c.nome}</strong> -{" "}
                        <span className="text-slate-500">
                          {c.telefone ? applyPhoneMask(c.telefone) : "Sem telefone"}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-2.5 text-xs text-slate-600 flex items-center justify-between gap-2 bg-slate-50">
                    <span>✨ Cliente não cadastrado. Preencha os dados abaixo para salvar.</span>
                  </div>
                )}
              </div>
            )}
        </div>

        {!isBloqueio && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Telefone</label>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                value={telefoneCliente}
                onChange={(e) =>
                  setTelefoneCliente(applyPhoneMask(e.target.value))
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)]"
              />
              <label className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eWhatsApp}
                  onChange={(e) => setEWhatsApp(e.target.checked)}
                  className="rounded text-[var(--cor-primaria)]"
                />
                É WhatsApp
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Data Nascimento</label>
              <input
                type="date"
                value={aniversarioCliente}
                onChange={(e) => setAniversarioCliente(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)]"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700">Profissional *</label>
          <select
            value={profissionalId}
            onChange={(e) => setProfissionalId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)] bg-white"
          >
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        {!isBloqueio && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Serviço *</label>
            <select
              value={servico}
              onChange={handleServicoChange}
              required={!isBloqueio}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)] bg-white"
            >
              <option value="" disabled>
                Selecione um serviço...
              </option>
              {servicos.map((s) => (
                <option key={s.id} value={s.nome}>
                  {s.nome} {s.preco ? `(R$ ${String(s.preco).replace(".", ",")})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Data *</label>
            <input
              type="date"
              value={dataAgendamento}
              onChange={(e) => setDataAgendamento(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Horário Início *</label>
            <input
              type="time"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)]"
            />
          </div>
        </div>

        {(() => {
          const dataHora = new Date(`${dataAgendamento.replace(/-/g, "/")} ${horario}`);
          const agora = new Date();
          if (!isNaN(dataHora.getTime()) && dataHora < agora) {
            return (
              <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Atenção:</strong> Este agendamento será salvo diretamente no histórico retroativo.
                </span>
              </div>
            );
          }
          return null;
        })()}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700">Duração (minutos)</label>
            <input
              type="number"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              min="1"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)]"
            />
          </div>

          {!isBloqueio && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">Valor (R$)</label>
              <input
                type="text"
                placeholder="Ex: 80,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[var(--cor-primaria)]"
              />
            </div>
          )}
        </div>

        {!agendamento && (
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecorrente}
                onChange={(e) => setIsRecorrente(e.target.checked)}
                className="rounded text-[var(--cor-primaria)]"
              />
              <RefreshCw size={14} className="text-[var(--cor-primaria)]" />
              Repetir agendamento (Recorrência)
            </label>

            {isRecorrente && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Frequência</label>
                    <select
                      value={tipoRecorrencia}
                      onChange={(e) => setTipoRecorrencia(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800"
                    >
                      <option value="semanal">Toda semana</option>
                      <option value="quinzenal">A cada 15 dias</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Data Final *</label>
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      min={dataAgendamento}
                      required={isRecorrente}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving
              ? "Salvando..."
              : agendamento
                ? "Salvar Alterações"
                : "Confirmar Agendamento"}
          </Button>
        </div>
      </form>

      {showConflictModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowConflictModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
              conflictInfo.tipo === "conflito_multiplo" ? "bg-sky-50 text-sky-600" : "bg-red-50 text-red-500"
            }`}>
              {conflictInfo.tipo === "conflito_multiplo" ? (
                <ListChecks size={28} strokeWidth={2.3} />
              ) : (
                <AlertTriangle size={28} strokeWidth={2.3} />
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {conflictInfo.tipo === "conflito_multiplo"
                ? "Ajustar Divergências"
                : "Horário Indisponível"}
            </h3>

            {conflictInfo.tipo !== "conflito_multiplo" && (
              <p className="text-sm text-slate-600 mb-6">
                <strong>{conflictInfo.profissionalNome}</strong> já possui
                um serviço ocupando o período de{" "}
                <strong>{conflictInfo.horario}</strong>.
              </p>
            )}

            {conflictInfo.tipo === "conflito_multiplo" && (
              <div className="text-left mb-6">
                <p className="text-xs text-slate-600 mb-3 text-center">
                  As datas abaixo já possuem agendamentos ocupando este horário.{" "}
                  <strong>Escolha um novo horário apenas para elas</strong> para
                  continuar salvando a série:
                </p>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-2 space-y-2">
                  {conflitosDetalhados.map((conflito, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200"
                    >
                      <span className="font-bold text-slate-700 text-sm">
                        {conflito.dataStr.split("-").reverse().join("/")}
                      </span>
                      <input
                        type="time"
                        value={conflito.novoHorario}
                        onChange={(e) => {
                          const novaLista = [...conflitosDetalhados];
                          novaLista[index].novoHorario = e.target.value;
                          setConflitosDetalhados(novaLista);
                        }}
                        className="px-2 py-1 border border-slate-300 rounded text-xs font-semibold text-[var(--cor-primaria)] bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full"
              onClick={
                conflictInfo.tipo === "conflito_multiplo"
                  ? handleResolverConflitosEmLote
                  : () => setShowConflictModal(false)
              }
              disabled={isSaving}
            >
              {isSaving
                ? "Validando..."
                : conflictInfo.tipo === "conflito_multiplo"
                  ? "Rever e Salvar Série"
                  : "Mudar Horário"}
            </Button>
          </div>
        </div>
      )}

      <ModalConfirmacaoRetroativo
        isOpen={showModalRetroativo}
        dataStr={dataAgendamento}
        horaStr={horario}
        onConfirmar={handleConfirmarRetroativo}
        onCancelar={handleCancelarRetroativo}
      />
    </Modal>
  );
}
