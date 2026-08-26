import { useState, useEffect } from "react";
import { X, RefreshCw, AlertTriangle, ListChecks, Lock } from "lucide-react";
import { supabase } from "../../../services/supabase";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../../../contexts/AuthContext";
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

export function ModalAgendamento({ isOpen, onClose, agendamento, onSave }) {
  const { profile } = useAuth();
  const dataHoje = new Date().toISOString().split("T")[0];

  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [listaClientesBanco, setListaClientesBanco] = useState([]);
  const [isBuscando, setIsBuscando] = useState(false);
  const [digitandoPeloUsuario, setDigitandoPeloUsuario] = useState(false);

  // Estados para carregar do banco
  const [listaProfissionais, setListaProfissionais] = useState([]);
  const [listaServicosBanco, setListaServicosBanco] = useState([]);

  const [dataAgendamento, setDataAgendamento] = useState(dataHoje);
  const [horario, setHorario] = useState("09:00");
  const [profissionalId, setProfissionalId] = useState("");
  const [servico, setServico] = useState("");
  const [duracao, setDuracao] = useState(60);
  const [valor, setValor] = useState("");

  const [isBloqueio, setIsBloqueio] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados de Recorrência
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [intervalo, setIntervalo] = useState(21);
  const [dataFim, setDataFim] = useState("");

  // ESTADOS DE RESOLUÇÃO DE CONFLITOS EM LOTE
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState({
    tipo: "conflito_simples",
    profissionalNome: "",
    horario: "",
  });
  const [pacotesPendentes, setPacotesPendentes] = useState([]);
  const [conflitosDetalhados, setConflitosDetalhados] = useState([]);

  // NOVO: ESTADOS DO MODAL DE SENHA PARA RETROATIVOS
  const [showSenhaModal, setShowSenhaModal] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [pacotesPendentesSenha, setPacotesPendentesSenha] = useState([]);

  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        const { data: profs } = await supabase
          .from("profissionais")
          .select("id, nome");
        if (profs) setListaProfissionais(profs);

        const { data: servs } = await supabase
          .from("servicos")
          .select("id, nome, preco");
        if (servs) setListaServicosBanco(servs);
      } catch (err) {
        console.error("Erro ao carregar dados do banco:", err);
      }
    }
    if (isOpen) {
      carregarDadosIniciais();
    }
  }, [isOpen]);

  useEffect(() => {
    if (agendamento) {
      // eslint-disable-next-line
      setDigitandoPeloUsuario(false);
      setBuscaCliente(agendamento.cliente);
      setProfissionalId(agendamento.profissionalId || "");
      setServico(agendamento.servico);
      setHorario(agendamento.horarioInicio);
      setDuracao(agendamento.duracao || 60);
      setValor(agendamento.valor);
      setIsBloqueio(agendamento.status === "bloqueio");

      setIsRecorrente(false);
      setIntervalo(21);
      setDataFim("");
    } else {
      setDigitandoPeloUsuario(true);
      setBuscaCliente("");
      setClienteSelecionado(null);
      setDataAgendamento(dataHoje);
      setHorario("09:00");
      setProfissionalId("");
      setServico("");
      setDuracao(60);
      setValor("");
      setIsBloqueio(false);

      setIsRecorrente(false);
      setIntervalo(21);
      setDataFim("");
    }
    setShowConflictModal(false);
    setPacotesPendentes([]);
    setConflitosDetalhados([]);
    
    // Reseta os estados de senha sempre que abrir o modal
    setShowSenhaModal(false);
    setSenhaDigitada("");
    setErroSenha("");
    setPacotesPendentesSenha([]);
    
    setIsSaving(false);
    setIsBuscando(false);
  }, [agendamento, isOpen, dataHoje]);

  useEffect(() => {
    const buscarClientesNoBanco = async () => {
      if (
        digitandoPeloUsuario &&
        buscaCliente.trim().length >= 2 &&
        !clienteSelecionado &&
        !isBloqueio
      ) {
        setIsBuscando(true);
        try {
          const { data, error } = await supabase
            .from("customers")
            .select("id, nome, telefone")
            .or(`nome.ilike.%${buscaCliente.trim()}%,telefone.ilike.%${buscaCliente.trim()}%`)
            .limit(5);

          if (error) throw error;
          if (data) setListaClientesBanco(data);
        } catch (error) {
          console.error("Erro ao buscar clientes:", error.message);
        } finally {
          setIsBuscando(false);
        }
      } else {
        setListaClientesBanco([]);
        setIsBuscando(false);
      }
    };

    const timer = setTimeout(() => buscarClientesNoBanco(), 300);
    return () => clearTimeout(timer);
  }, [buscaCliente, clienteSelecionado, isBloqueio, digitandoPeloUsuario]);

  if (!isOpen) return null;

  const calcularHoraFim = (horaInicio, duracaoMinutos) => {
    if (!horaInicio) return "";
    const [horas, minutos] = horaInicio.split(":").map(Number);
    const data = new Date();
    data.setHours(horas, minutos + Number(duracaoMinutos), 0);
    return data.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const horaFim = calcularHoraFim(horario, duracao);

  const prepararSalvamento = async (dataRHF, e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      if (!isBloqueio) {
        agendamentoSchema.parse({
          cliente: clienteSelecionado ? clienteSelecionado.nome : buscaCliente,
          dataAgendamento,
          horario,
          profissionalId,
          servico,
          duracao: Number(duracao),
          valor
        });
      }
    } catch (err) {
      if (err.errors) {
        alert("Erros de validação:\n" + err.errors.map(e => e.message).join("\n"));
      } else {
        alert("Erro de validação.");
      }
      setIsSaving(false);
      return;
    }

    const dataHoraEscolhida = new Date(
      `${dataAgendamento.replace(/-/g, "/")} ${horario}`,
    );
    const agora = new Date();

    let pacotesIniciais = [{ dataStr: dataAgendamento, horaStr: horario }];

    if (!agendamento && isRecorrente && dataFim) {
      let dataAtualLoop = new Date(`${dataAgendamento}T12:00:00`);
      let dataFinalLimite = new Date(`${dataFim}T12:00:00`);

      dataAtualLoop.setDate(dataAtualLoop.getDate() + Number(intervalo));

      while (dataAtualLoop <= dataFinalLimite) {
        pacotesIniciais.push({
          dataStr: dataAtualLoop.toISOString().split("T")[0],
          horaStr: horario,
        });
        dataAtualLoop.setDate(dataAtualLoop.getDate() + Number(intervalo));
      }
    }

    // NOVA LÓGICA: Permitir a hora atual. Removemos os minutos e segundos de 'agora' para que 22:41 permita 22:00
    const agoraTruncado = new Date(agora);
    agoraTruncado.setMinutes(0, 0, 0);

    // Se for no passado (antes da hora atual), barra aqui e abre o modal de senha
    if (dataHoraEscolhida < agoraTruncado) {
      setPacotesPendentesSenha(pacotesIniciais);
      setShowSenhaModal(true);
      setIsSaving(false);
      return;
    }

    // Se for no futuro, segue a vida normal
    validarESalvar(pacotesIniciais);
  };

  // FUNÇÃO DE VALIDAÇÃO DE SENHA
  const handleConfirmarSenha = (e) => {
    e.preventDefault();
    
    // AQUI VOCÊ DEFINE A SENHA PADRÃO DO SISTEMA
    const SENHA_PADRAO = "admin123"; 

    if (senhaDigitada === SENHA_PADRAO) {
      setErroSenha("");
      setShowSenhaModal(false);
      setIsSaving(true);
      validarESalvar(pacotesPendentesSenha); // Continua o fluxo de salvamento
    } else {
      setErroSenha("Senha incorreta. Tente novamente.");
    }
  };

  const validarESalvar = async (pacotes) => {
    try {
      const dataMin = pacotes[0].dataStr;
      const dataMax = pacotes[pacotes.length - 1].dataStr;

      const { data: conflitosBanco, error: erroConflito } = await supabase
        .from("appointments")
        .select("id, data_horario, duracao")
        .eq("profissional_id", profissionalId)
        .gte("data_horario", `${dataMin}T00:00:00-03:00`)
        .lte("data_horario", `${dataMax}T23:59:59-03:00`)
        .neq("status", "cancelado");

      if (erroConflito) throw erroConflito;

      const conflitosReais =
        conflitosBanco?.filter((item) => {
          if (agendamento && item.id === agendamento.id) return false;

          const dbStartMs = new Date(item.data_horario).getTime();
          const dbDuracao = item.duracao || 60;
          const dbEndMs = dbStartMs + dbDuracao * 60000;

          return pacotes.some((p) => {
            const newStartMs = new Date(
              `${p.dataStr}T${p.horaStr}:00-03:00`,
            ).getTime();
            const newEndMs = newStartMs + Number(duracao) * 60000;

            return newStartMs < dbEndMs && newEndMs > dbStartMs;
          });
        }) || [];

      if (conflitosReais.length > 0) {
        const profObj = listaProfissionais.find((p) => p.id === profissionalId);

        const pacotesConflitantes = pacotes.filter((p) => {
          const newStartMs = new Date(
            `${p.dataStr}T${p.horaStr}:00-03:00`,
          ).getTime();
          const newEndMs = newStartMs + Number(duracao) * 60000;

          return conflitosReais.some((c) => {
            const dbStartMs = new Date(c.data_horario).getTime();
            const dbDuracao = c.duracao || 60;
            const dbEndMs = dbStartMs + dbDuracao * 60000;
            return newStartMs < dbEndMs && newEndMs > dbStartMs;
          });
        });

        if (pacotes.length === 1) {
          setConflictInfo({
            tipo: "conflito_simples",
            profissionalNome: profObj ? profObj.nome : "A profissional",
            horario: `${pacotes[0].horaStr} do dia ${pacotes[0].dataStr.split("-").reverse().join("/")}`,
          });
        } else {
          setPacotesPendentes(pacotes);
          setConflitosDetalhados(
            pacotesConflitantes.map((p) => ({
              dataStr: p.dataStr,
              horarioAtual: p.horaStr,
              novoHorario: p.horaStr,
            })),
          );
          setConflictInfo({ tipo: "conflito_multiplo" });
        }

        setShowConflictModal(true);
        setIsSaving(false);
        return;
      }

      let customerIdFinal = clienteSelecionado ? clienteSelecionado.id : null;

      if (!isBloqueio && !customerIdFinal && buscaCliente.trim()) {
        const { data: novoCliente, error: errCliente } = await supabase
          .from("customers")
          .insert([{ nome: buscaCliente.trim(), tenant_id: profile?.tenant_id }])
          .select("id");

        if (errCliente) throw errCliente;
        if (novoCliente && novoCliente.length > 0) {
          customerIdFinal = novoCliente[0].id;
        }
      }

      const idGrupoRecorrencia =
        !agendamento && isRecorrente
          ? `rec_${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`
          : agendamento?.grupo_recorrencia || null;

      const pacotesSalvarBanco = pacotes.map((p) => ({
        customer_id: isBloqueio ? null : customerIdFinal,
        profissional_id: profissionalId,
        servico: isBloqueio ? buscaCliente || "Pausa" : servico,
        valor: isBloqueio ? 0 : Number(String(valor).replace(",", ".")) || 0,
        data_horario: `${p.dataStr}T${p.horaStr}:00-03:00`,
        duracao: Number(duracao),
        status: isBloqueio ? "bloqueio" : "pendente",
        pagamento: "pendente",
        grupo_recorrencia: idGrupoRecorrencia,
        tenant_id: profile?.tenant_id,
      }));

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
    <div className="modal-overlay">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div
          className="modal-header"
          style={{ alignItems: "center", marginBottom: "1.2rem" }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
              {agendamento ? "Editar Agendamento" : "Novo Agendamento"}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.85rem",
                cursor: "pointer",
                color: "#64748B",
                fontWeight: "500",
                userSelect: "none",
              }}
            >
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
                style={{
                  width: "15px",
                  height: "15px",
                  cursor: "pointer",
                  accentColor: "var(--cor-primaria)",
                }}
              />
              Pausa
            </label>

            <button className="btn-fechar" onClick={onClose} title="Fechar">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(prepararSalvamento)} className="form-agendamento">
          <div className="form-grupo" style={{ position: "relative" }}>
            <label>
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
              onChange={(e) => {
                setDigitandoPeloUsuario(true);
                setBuscaCliente(e.target.value);
                setClienteSelecionado(null);
              }}
              required
            />

            {!isBloqueio &&
              digitandoPeloUsuario &&
              buscaCliente.trim().length >= 2 &&
              !clienteSelecionado && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "#FFFFFF",
                    border: "1px solid var(--cor-borda)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 10,
                    marginTop: "4px",
                    maxHeight: "150px",
                    overflowY: "auto",
                  }}
                >
                  {isBuscando ? (
                    <div
                      style={{
                        padding: "0.8rem 1rem",
                        fontSize: "0.9rem",
                        color: "#64748B",
                        textAlign: "center",
                        fontStyle: "italic",
                      }}
                    >
                      Buscando...
                    </div>
                  ) : listaClientesBanco.length > 0 ? (
                    listaClientesBanco.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setClienteSelecionado(c);
                          setBuscaCliente(c.nome);
                          setListaClientesBanco([]);
                        }}
                        style={{
                          padding: "0.6rem 1rem",
                          cursor: "pointer",
                          borderBottom: "1px solid #F1F5F9",
                          fontSize: "0.9rem",
                          color: "var(--cor-texto)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#F8FAFC")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "#FFFFFF")
                        }
                      >
                        <strong>{c.nome}</strong> -{" "}
                        <span style={{ color: "#64748B" }}>
                          {c.telefone || "Sem telefone"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "0.8rem 1rem",
                        fontSize: "0.9rem",
                        color: "#EF4444",
                        textAlign: "center",
                        fontWeight: "500",
                      }}
                    >
                      Nenhum cliente encontrado.
                    </div>
                  )}
                </div>
              )}
          </div>

          <div className="form-linha-dupla">
            <div className="form-grupo">
              <label>Data</label>
              <input
                type="date"
                value={dataAgendamento}
                onChange={(e) => setDataAgendamento(e.target.value)}
                required
              />
            </div>

            <div className="form-grupo">
              <label>Horário Início</label>
              <input
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.8rem",
                  borderRadius: "8px",
                  border: "1px solid var(--cor-borda)",
                  fontSize: "1rem",
                  color: "var(--cor-texto)",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          <div className="form-linha-dupla">
            <div className="form-grupo">
              <label>Profissional</label>
              <select
                value={profissionalId}
                onChange={(e) => setProfissionalId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione a profissional...
                </option>
                {listaProfissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            {!isBloqueio && (
              <div className="form-grupo">
                <label>Serviço</label>
                <select
                  value={servico}
                  onChange={(e) => {
                    const servicoEscolhido = e.target.value;
                    setServico(servicoEscolhido);
                    const infoServico = listaServicosBanco.find(
                      (s) => s.nome === servicoEscolhido,
                    );
                    if (infoServico)
                      setValor(String(infoServico.preco).replace(".", ","));
                  }}
                  required={!isBloqueio}
                >
                  <option value="" disabled>
                    Selecione um serviço...
                  </option>
                  {listaServicosBanco.map((s) => (
                    <option key={s.id} value={s.nome}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="form-linha-dupla">
            <div className="form-grupo">
              <label>Duração Prevista</label>
              <select
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
              >
                {[30, 45, 60, 90, 120, 150, 180, 240].map((d) => (
                  <option key={d} value={d}>
                    {d >= 60
                      ? `${Math.floor(d / 60)}h ${d % 60 > 0 ? (d % 60) + "min" : ""}`
                      : `${d} min`}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-grupo">
              <label>Término (Automático)</label>
              <input
                type="text"
                value={horaFim}
                disabled
                style={{
                  backgroundColor: "#F1F5F9",
                  fontWeight: "600",
                  color: "#64748B",
                  cursor: "not-allowed",
                }}
              />
            </div>
          </div>

          {!isBloqueio && (
            <div className="form-linha-dupla">
              <div className="form-grupo">
                <label>Valor (R$)</label>
                <input
                  type="text"
                  placeholder="Ex: 65,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required={!isBloqueio}
                />
              </div>
              <div
                className="form-grupo"
                style={{ visibility: "hidden" }}
              ></div>
            </div>
          )}

          {!agendamento && (
            <div
              className="form-grupo"
              style={{
                marginTop: "1rem",
                backgroundColor: "#F8FAFC",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  margin: 0,
                  fontWeight: "600",
                  color: "var(--cor-primaria)",
                  userSelect: "none",
                }}
              >
                <input
                  type="checkbox"
                  checked={isRecorrente}
                  onChange={(e) => setIsRecorrente(e.target.checked)}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "var(--cor-primaria)",
                  }}
                />
                <RefreshCw size={16} /> Tornar agendamento recorrente
              </label>

              {isRecorrente && (
                <div style={{ marginTop: "1.2rem" }}>
                  <label
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--cor-primaria)",
                      fontWeight: "600",
                      marginBottom: "8px",
                      display: "block",
                    }}
                  >
                    Intervalo de dias
                  </label>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "1rem",
                    }}
                  >
                    {[7, 14, 21, 28].map((dias) => (
                      <button
                        key={dias}
                        type="button"
                        onClick={() => setIntervalo(dias)}
                        style={{
                          flex: 1,
                          padding: "8px 0",
                          borderRadius: "8px",
                          border: `1px solid ${Number(intervalo) === dias ? "var(--cor-primaria)" : "#CBD5E1"}`,
                          backgroundColor:
                            Number(intervalo) === dias
                              ? "var(--cor-primaria)"
                              : "transparent",
                          color:
                            Number(intervalo) === dias
                              ? "#FFFFFF"
                              : "var(--cor-primaria)",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {dias} dias
                      </button>
                    ))}
                  </div>

                  <div className="form-linha-dupla">
                    <div className="form-grupo">
                      <label
                        style={{
                          color: "var(--cor-primaria)",
                          fontSize: "0.85rem",
                        }}
                      >
                        Data Inicial *
                      </label>
                      <input
                        type="date"
                        value={dataAgendamento}
                        disabled
                        style={{
                          backgroundColor: "#E2E8F0",
                          color: "#64748B",
                          cursor: "not-allowed",
                        }}
                      />
                    </div>
                    <div className="form-grupo">
                      <label
                        style={{
                          color: "var(--cor-primaria)",
                          fontSize: "0.85rem",
                        }}
                      >
                        Data Final *
                      </label>
                      <input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        min={dataAgendamento}
                        required={isRecorrente}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn-salvar"
            style={{
              marginTop: "1.5rem",
              opacity: isSaving ? 0.7 : 1,
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
            disabled={isSaving}
          >
            {isSaving
              ? "Salvando..."
              : agendamento
                ? "Salvar Alterações"
                : "Confirmar Agendamento"}
          </button>
        </form>
      </div>

      {/* --- NOVO MODAL DE SENHA PARA AGENDAMENTO RETROATIVO --- */}
      {showSenhaModal && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1200, backgroundColor: "rgba(15, 23, 42, 0.7)" }}
        >
          <div
            className="modal-box"
            style={{
              maxWidth: "400px",
              textAlign: "center",
              padding: "2rem 1.5rem",
              borderRadius: "16px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                margin: "0 auto 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#FFFBEB",
                color: "#D97706",
              }}
            >
              <Lock size={28} strokeWidth={2.3} />
            </div>

            <h3 style={{ fontSize: "1.25rem", color: "#1E293B", margin: "0 0 0.5rem 0" }}>
              Agendamento Retroativo
            </h3>
            
            <p style={{ fontSize: "0.95rem", color: "#64748B", marginBottom: "1.5rem", lineHeight: "1.5" }}>
              Você está tentando salvar um horário que já passou. Insira a senha de autorização para prosseguir.
            </p>

            <form onSubmit={handleConfirmarSenha}>
              <input
                type="password"
                placeholder="Digite a senha..."
                value={senhaDigitada}
                onChange={(e) => {
                  setSenhaDigitada(e.target.value);
                  setErroSenha("");
                }}
                style={{
                  width: "100%",
                  padding: "0.8rem",
                  borderRadius: "8px",
                  border: `1px solid ${erroSenha ? "#EF4444" : "#CBD5E1"}`,
                  fontSize: "1rem",
                  textAlign: "center",
                  letterSpacing: "2px",
                  marginBottom: erroSenha ? "0.5rem" : "1.5rem",
                }}
                autoFocus
              />
              {erroSenha && (
                <div style={{ color: "#EF4444", fontSize: "0.85rem", marginBottom: "1rem", fontWeight: "500" }}>
                  {erroSenha}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSenhaModal(false);
                    setSenhaDigitada("");
                    setErroSenha("");
                  }}
                  style={{
                    flex: 1,
                    padding: "0.8rem",
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#FFFFFF",
                    color: "#475569",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "0.8rem",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "var(--cor-primaria)",
                    color: "#FFFFFF",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Autorizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* -------------------------------------------------------- */}

      {showConflictModal && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1100, backgroundColor: "rgba(15, 23, 42, 0.6)" }}
          onClick={() => setShowConflictModal(false)}
        >
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth:
                conflictInfo.tipo === "conflito_multiplo" ? "480px" : "400px",
              textAlign: "center",
              padding: "2rem 1.5rem",
              borderRadius: "16px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                margin: "0 auto 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: conflictInfo.tipo === "conflito_multiplo" ? "#E0F2FE" : "#FEE2E2",
                color: conflictInfo.tipo === "conflito_multiplo" ? "#0284C7" : "#E11D48",
              }}
            >
              {conflictInfo.tipo === "conflito_multiplo" ? (
                <ListChecks size={28} strokeWidth={2.3} />
              ) : (
                <AlertTriangle size={28} strokeWidth={2.3} />
              )}
            </div>

            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: "#1E293B",
                margin: "0 0 0.5rem 0",
              }}
            >
              {conflictInfo.tipo === "conflito_multiplo"
                  ? "Ajustar Divergências"
                  : "Horário Indisponível"}
            </h3>

            {conflictInfo.tipo !== "conflito_multiplo" && (
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "#64748B",
                  lineHeight: "1.5",
                  margin: "0 0 1.5rem 0",
                }}
              >
                <strong>{conflictInfo.profissionalNome}</strong> já possui
                um serviço ocupando o período de{" "}
                <strong>{conflictInfo.horario}</strong>.
              </p>
            )}

            {conflictInfo.tipo === "conflito_multiplo" && (
              <div style={{ textAlign: "left", marginBottom: "1.5rem" }}>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#64748B",
                    lineHeight: "1.4",
                    margin: "0 0 1rem 0",
                    textAlign: "center",
                  }}
                >
                  As datas abaixo já possuem agendamentos ocupando este horário.{" "}
                  <strong>Escolha um novo horário apenas para elas</strong> para
                  continuar salvando a série:
                </p>

                <div
                  style={{
                    maxHeight: "220px",
                    overflowY: "auto",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    backgroundColor: "#F8FAFC",
                  }}
                >
                  {conflitosDetalhados.map((conflito, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px",
                        borderBottom:
                          index < conflitosDetalhados.length - 1
                            ? "1px solid #E2E8F0"
                            : "none",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "700",
                          color: "#334155",
                          fontSize: "0.95rem",
                        }}
                      >
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
                        style={{
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "1px solid #CBD5E1",
                          fontFamily: "inherit",
                          fontWeight: "600",
                          color: "var(--cor-primaria)",
                          backgroundColor: "#FFFFFF",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={
                conflictInfo.tipo === "conflito_multiplo"
                  ? handleResolverConflitosEmLote
                  : () => setShowConflictModal(false)
              }
              disabled={isSaving}
              style={{
                width: "100%",
                padding: "0.8rem",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "var(--cor-primaria)",
                color: "#FFFFFF",
                fontWeight: "600",
                fontSize: "1rem",
                cursor: isSaving ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving
                ? "Validando..."
                : conflictInfo.tipo === "conflito_multiplo"
                  ? "Rever e Salvar Série"
                  : "Mudar Horário"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}