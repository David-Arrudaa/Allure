import React, { useState, useEffect } from "react";
import { X, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "../../services/supabase";
import "./ModalAgendamento.css";

export function ModalAgendamento({ isOpen, onClose, agendamento, onSave }) {
  const dataHoje = new Date().toISOString().split("T")[0];

  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [listaClientesBanco, setListaClientesBanco] = useState([]);

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

  // Estados de Recorrência
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [intervalo, setIntervalo] = useState(21);
  const [dataFim, setDataFim] = useState("");

  // Estado do Modal de Conflito de Horário
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState({
    profissionalNome: "",
    horario: "",
  });

  // Busca profissionais e serviços do banco ao abrir o modal
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
      setBuscaCliente(agendamento.cliente);
      setProfissionalId(agendamento.profissionalId || "");
      setServico(agendamento.servico);
      setHorario(agendamento.horarioInicio);
      setDuracao(agendamento.duracao);
      setValor(agendamento.valor);
      setIsBloqueio(agendamento.status === "bloqueio");

      setIsRecorrente(false);
      setIntervalo(21);
      setDataFim("");
    } else {
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
  }, [agendamento, isOpen, dataHoje]);

  // BUSCA AS CLIENTES NO SUPABASE QUANDO DIGITAR 3 OU MAIS CARACTERES
  useEffect(() => {
    const buscarClientesNoBanco = async () => {
      if (
        buscaCliente.trim().length >= 3 &&
        !clienteSelecionado &&
        !isBloqueio
      ) {
        try {
          const { data, error } = await supabase
            .from("customers")
            .select("id, nome, telefone")
            .ilike("nome", `%${buscaCliente.trim()}%`)
            .limit(5);

          if (error) throw error;
          if (data) {
            setListaClientesBanco(data);
          }
        } catch (error) {
          console.error("Erro ao buscar clientes:", error.message);
        }
      } else {
        setListaClientesBanco([]);
      }
    };

    const timer = setTimeout(() => {
      buscarClientesNoBanco();
    }, 300);

    return () => clearTimeout(timer);
  }, [buscaCliente, clienteSelecionado, isBloqueio]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const dataHoraCompleta = `${dataAgendamento}T${horario}:00-03:00`;

      // 1. VALIDAÇÃO DE CONFLITO DE HORÁRIO
      const { data: conflitos, error: erroConflito } = await supabase
        .from("appointments")
        .select("id")
        .eq("profissional_id", profissionalId)
        .eq("data_horario", dataHoraCompleta)
        .neq("status", "cancelado");

      if (erroConflito) throw erroConflito;

      const temConflito =
        conflitos &&
        conflitos.some((item) => !agendamento || item.id !== agendamento.id);

      if (temConflito) {
        const profObj = listaProfissionais.find((p) => p.id === profissionalId);
        setConflictInfo({
          profissionalNome: profObj ? profObj.nome : "A profissional",
          horario: horario,
        });
        setShowConflictModal(true);
        return;
      }

      let customerIdFinal = clienteSelecionado ? clienteSelecionado.id : null;

      if (!isBloqueio && !customerIdFinal && buscaCliente.trim()) {
        const { data: novoCliente, error: errCliente } = await supabase
          .from("customers")
          .insert([{ nome: buscaCliente.trim() }])
          .select("id");

        if (errCliente) throw errCliente;
        if (novoCliente && novoCliente.length > 0) {
          customerIdFinal = novoCliente[0].id;
        }
      }

      const pacoteSalvarBanco = {
        customer_id: isBloqueio ? null : customerIdFinal,
        profissional_id: profissionalId,
        servico: isBloqueio ? buscaCliente || "Pausa" : servico,
        valor: isBloqueio ? 0 : Number(String(valor).replace(",", ".")) || 0,
        data_horario: dataHoraCompleta,
        status: isBloqueio ? "bloqueio" : "pendente",
        pagamento: "pendente",
      };

      let resSalvar;
      if (agendamento && agendamento.id) {
        resSalvar = await supabase
          .from("appointments")
          .update(pacoteSalvarBanco)
          .eq("id", agendamento.id);
      } else {
        resSalvar = await supabase
          .from("appointments")
          .insert([pacoteSalvarBanco]);
      }

      if (resSalvar && resSalvar.error) {
        throw resSalvar.error;
      }

      if (onSave) {
        onSave();
      }
      onClose();
    } catch (err) {
      console.error("Erro ao salvar agendamento:", err);
      alert("Erro ao salvar agendamento: " + (err.message || err));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
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

        <form onSubmit={handleSubmit} className="form-agendamento">
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
                setBuscaCliente(e.target.value);
                setClienteSelecionado(null);
              }}
              required
            />

            {!isBloqueio &&
              listaClientesBanco.length > 0 &&
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
                  {listaClientesBanco.map((c) => (
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
                  ))}
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

          <button
            type="submit"
            className="btn-salvar"
            style={{ marginTop: "1.5rem" }}
          >
            {agendamento ? "Salvar Alterações" : "Confirmar Agendamento"}
          </button>
        </form>
      </div>

      {/* MODAL DE AVISO DE CONFLITO DE HORÁRIO */}
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
              maxWidth: "400px",
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
                backgroundColor: "#FEE2E2",
                color: "#E11D48",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <AlertTriangle size={28} strokeWidth={2.3} />
            </div>

            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "700",
                color: "#1E293B",
                margin: "0 0 0.5rem 0",
              }}
            >
              Horário Indisponível
            </h3>

            <p
              style={{
                fontSize: "0.95rem",
                color: "#64748B",
                lineHeight: "1.5",
                margin: "0 0 1.5rem 0",
              }}
            >
              <strong>{conflictInfo.profissionalNome}</strong> já possui um
              agendamento marcado para as{" "}
              <strong>{conflictInfo.horario}</strong> nesta data.
            </p>

            <button
              type="button"
              onClick={() => setShowConflictModal(false)}
              style={{
                width: "100%",
                padding: "0.8rem",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "var(--cor-primaria)",
                color: "#FFFFFF",
                fontWeight: "600",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Mudar Horário
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
