import React, { useState, useEffect } from "react";
import { X, RefreshCw } from "lucide-react";
import "./ModalAgendamento.css";

export function ModalAgendamento({ isOpen, onClose, agendamento }) {
  const dataHoje = new Date().toISOString().split("T")[0];

  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [dataAgendamento, setDataAgendamento] = useState(dataHoje);
  const [horario, setHorario] = useState("09:00");
  const [profissional, setProfissional] = useState("Ana Silva");
  const [servico, setServico] = useState("");
  const [duracao, setDuracao] = useState(60);
  const [valor, setValor] = useState("");

  const [isRecorrente, setIsRecorrente] = useState(false);
  const [intervalo, setIntervalo] = useState(21);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // O EFEITO MÁGICO: Preenche os dados se vier um agendamento para edição
  useEffect(() => {
    if (agendamento) {
      setBuscaCliente(agendamento.cliente);
      setProfissional(agendamento.profissional);
      setServico(agendamento.servico);
      setHorario(agendamento.horarioInicio);
      setDuracao(agendamento.duracao);
      setValor(agendamento.valor);
    } else {
      // Limpa os campos se for um "Novo Agendamento"
      setBuscaCliente("");
      setClienteSelecionado(null);
      setDataAgendamento(dataHoje);
      setHorario("09:00");
      setProfissional("Ana Silva");
      setServico("");
      setDuracao(60);
      setValor("");
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
    const nomeFinal = clienteSelecionado
      ? clienteSelecionado.nome
      : buscaCliente;

    const pacoteSalvar = {
      id: agendamento ? agendamento.id : Math.random(), // Mantém o ID se for edição
      cliente: nomeFinal,
      data: dataAgendamento,
      profissional: profissional,
      servico: servico,
      horarioInicio: horario,
      horarioFim: horaFim,
      duracao: duracao,
      valor: valor,
      status: agendamento ? agendamento.status : "pendente", // Mantém status na edição
      recorrencia: isRecorrente
        ? { intervalo, dataInicio, dataFim }
        : "Nenhuma",
    };

    console.log(agendamento ? "Editando:" : "Novo:", pacoteSalvar);
    alert(
      `${agendamento ? "Edição salva" : "Agendamento confirmado"} com sucesso!`,
    );
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{agendamento ? "Editar Agendamento" : "Novo Agendamento"}</h2>
          <button className="btn-fechar" onClick={onClose} title="Fechar">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-agendamento">
          <div className="form-grupo" style={{ position: "relative" }}>
            <label>Nome da Cliente</label>
            <input
              type="text"
              placeholder="Digite o nome da cliente..."
              value={
                clienteSelecionado ? clienteSelecionado.nome : buscaCliente
              }
              onChange={(e) => {
                setBuscaCliente(e.target.value);
                setClienteSelecionado(null);
              }}
              required
            />

            {buscaCliente.trim().length >= 3 && !clienteSelecionado && (
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
              <label>Data do Agendamento</label>
              <input
                type="date"
                value={dataAgendamento}
                onChange={(e) => setDataAgendamento(e.target.value)}
                required
              />
            </div>
            <div className="form-grupo">
              <label>Horário Início</label>
              <select
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
              >
                {[
                  "07:00",
                  "07:30",
                  "08:00",
                  "08:30",
                  "09:00",
                  "09:30",
                  "10:00",
                  "10:30",
                  "11:00",
                  "11:30",
                  "12:00",
                  "12:30",
                  "13:00",
                  "13:30",
                  "14:00",
                  "14:30",
                  "15:00",
                  "15:30",
                  "16:00",
                  "16:30",
                  "17:00",
                  "17:30",
                  "18:00",
                  "18:30",
                  "19:00",
                  "19:30",
                  "20:00",
                ].map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
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
                required
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

          <div className="form-linha-dupla">
            <div className="form-grupo">
              <label>Valor (R$)</label>
              <input
                type="text"
                placeholder="Ex: 65,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>
            <div className="form-grupo" style={{ visibility: "hidden" }}></div>
          </div>

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
