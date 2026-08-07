import React, { useState, useEffect } from "react";
import { X, RefreshCw } from "lucide-react";
import "./ModalAgendamento.css";

export function ModalAgendamento({ isOpen, onClose, agendamento, onSave }) {
  const dataHoje = new Date().toISOString().split("T")[0];

  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [dataAgendamento, setDataAgendamento] = useState(dataHoje);
  const [horario, setHorario] = useState("09:00");
  const [profissional, setProfissional] = useState("Ana Silva");
  const [servico, setServico] = useState("");
  const [duracao, setDuracao] = useState(60);
  const [valor, setValor] = useState("");

  // NOVO ESTADO: Controla se é um bloqueio ou cliente normal
  const [isBloqueio, setIsBloqueio] = useState(false);

  const [isRecorrente, setIsRecorrente] = useState(false);
  const [intervalo, setIntervalo] = useState(21);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    if (agendamento) {
      setBuscaCliente(agendamento.cliente);
      setProfissional(agendamento.profissional);
      setServico(agendamento.servico);
      setHorario(agendamento.horarioInicio);
      setDuracao(agendamento.duracao);
      setValor(agendamento.valor);
      setIsBloqueio(agendamento.status === "bloqueio"); // Se for edição de pausa, já marca a caixinha
    } else {
      setBuscaCliente("");
      setClienteSelecionado(null);
      setDataAgendamento(dataHoje);
      setHorario("09:00");
      setProfissional("Ana Silva");
      setServico("");
      setDuracao(60);
      setValor("");
      setIsBloqueio(false); // Garante que novo agendamento vem desmarcado
    }
  }, [agendamento, isOpen, dataHoje]);

  const clientesCadastradas = [
    { id: 1, nome: "Juliana Costa", telefone: "(15) 99999-1111" },
    { id: 2, nome: "Camila Mendes", telefone: "(15) 99999-2222" },
    { id: 3, nome: "Amanda Reis", telefone: "(15) 99999-3333" },
    { id: 4, nome: "Mariana Souza", telefone: "(15) 99999-4444" },
  ];

  const servicosCadastrados = [
    { id: 1, nome: "Manicure", valor: "35,00" },
    { id: 2, nome: "Pedicure", valor: "35,00" },
    { id: 3, nome: "Pé e Mão", valor: "65,00" },
    { id: 4, nome: "Manutenção em Gel", valor: "120,00" },
    { id: 5, nome: "Spa dos Pés", valor: "50,00" },
  ];

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

  const handleSubmit = (e) => {
    e.preventDefault();

    // Se for bloqueio, pega o que foi digitado direto. Se não, usa a seleção normal.
    const nomeFinal = isBloqueio
      ? buscaCliente
      : clienteSelecionado
        ? clienteSelecionado.nome
        : buscaCliente;

    // Constrói o pacote com os dados
    const pacoteSalvar = {
      id: agendamento ? agendamento.id : null,
      cliente: nomeFinal,
      data: dataAgendamento,
      profissional: profissional,
      servico: isBloqueio ? "Pausa" : servico,
      horarioInicio: horario,
      duracao: Number(duracao),
      valor: isBloqueio ? "-" : valor,
      status: isBloqueio
        ? "bloqueio"
        : agendamento
          ? agendamento.status
          : "pendente",
    };

    // Dispara a função que desenha na Agenda
    if (onSave) {
      onSave(pacoteSalvar);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* CABEÇALHO COMPACTO COM A OPÇÃO DE BLOQUEIO DISCRETA */}
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
            {/* Checkbox discreto alinhado no topo */}
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
                    setServico("Pausa");
                    setValor("-");
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

            {/* Mostra a lista suspensa SÓ se NÃO for bloqueio */}
            {!isBloqueio &&
              buscaCliente.trim().length >= 3 &&
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
                  {clientesCadastradas
                    .filter((c) =>
                      c.nome.toLowerCase().includes(buscaCliente.toLowerCase()),
                    )
                    .map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setClienteSelecionado(c);
                          setBuscaCliente(c.nome);
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
                        <span style={{ color: "#64748B" }}>{c.telefone}</span>
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

            {/* NOVO CAMPO DE HORÁRIO COM RELÓGIO NATIVO */}
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
                value={profissional}
                onChange={(e) => setProfissional(e.target.value)}
              >
                <option value="Ana Silva">Ana Silva</option>
                <option value="Beatriz Santos">Beatriz Santos</option>
                <option value="Carla Dias">Carla Dias</option>
              </select>
            </div>

            {/* Esconde Serviço e Valor se for bloqueio */}
            {!isBloqueio && (
              <div className="form-grupo">
                <label>Serviço</label>
                <select
                  value={servico}
                  onChange={(e) => {
                    const servicoEscolhido = e.target.value;
                    setServico(servicoEscolhido);
                    const infoServico = servicosCadastrados.find(
                      (s) => s.nome === servicoEscolhido,
                    );
                    if (infoServico) setValor(infoServico.valor);
                  }}
                  required={!isBloqueio}
                >
                  <option value="" disabled>
                    Selecione um serviço...
                  </option>
                  {servicosCadastrados.map((s) => (
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
    </div>
  );
}
