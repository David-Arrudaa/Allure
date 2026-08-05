import React, { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import "./ModalAgendamento.css";

export function ModalAgendamento({ isOpen, onClose }) {
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [profissional, setProfissional] = useState("Ana Silva");
  const [servico, setServico] = useState("");
  const [horario, setHorario] = useState("09:00");
  const [valor, setValor] = useState("");

  // NOVOS ESTADOS DA RECORRÊNCIA
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [intervalo, setIntervalo] = useState(21); // Padrão selecionado: 21 dias
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // 1. Tabela simulada de Clientes
  const clientesCadastradas = [
    { id: 1, nome: "Juliana Costa", telefone: "(15) 99999-1111" },
    { id: 2, nome: "Camila Mendes", telefone: "(15) 99999-2222" },
    { id: 3, nome: "Amanda Reis", telefone: "(15) 99999-3333" },
    { id: 4, nome: "Mariana Souza", telefone: "(15) 99999-4444" },
  ];

  // 2. Tabela simulada de Serviços
  const servicosCadastrados = [
    { id: 1, nome: "Manicure", valor: "35,00" },
    { id: 2, nome: "Pedicure", valor: "35,00" },
    { id: 3, nome: "Pé e Mão", valor: "65,00" },
    { id: 4, nome: "Manutenção em Gel", valor: "120,00" },
    { id: 5, nome: "Spa dos Pés", valor: "50,00" },
  ];

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const nomeFinal = clienteSelecionado
      ? clienteSelecionado.nome
      : buscaCliente;

    // A lógica de cálculo de domingos/segundas e checagem de conflitos entrará aqui
    console.log({
      cliente: nomeFinal,
      profissional,
      servico,
      horario,
      valor,
      recorrencia: isRecorrente
        ? { intervalo, dataInicio, dataFim }
        : "Nenhuma",
    });

    alert(
      `Agendamento de ${nomeFinal} confirmado para ${horario}! Valor: R$ ${valor}`,
    );

    // Limpa os campos após salvar
    setBuscaCliente("");
    setClienteSelecionado(null);
    setServico("");
    setValor("");
    setIsRecorrente(false);
    setDataInicio("");
    setDataFim("");
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Novo Agendamento</h2>
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
              <label>Horário</label>
              <select
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
              >
                {[
                  "09:00",
                  "10:00",
                  "11:00",
                  "12:00",
                  "13:00",
                  "14:00",
                  "15:00",
                  "16:00",
                  "17:00",
                  "18:00",
                  "19:00",
                  "20:00",
                  "21:00",
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
              <label>Serviço</label>
              <select
                value={servico}
                onChange={(e) => {
                  const servicoEscolhido = e.target.value;
                  setServico(servicoEscolhido);

                  const infoServico = servicosCadastrados.find(
                    (s) => s.nome === servicoEscolhido,
                  );
                  if (infoServico) {
                    setValor(infoServico.valor);
                  }
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
          </div>

          {/* SESSÃO DE RECORRÊNCIA */}
          <div className="recorrencia-container">
            <label className="recorrencia-toggle">
              <input
                type="checkbox"
                checked={isRecorrente}
                onChange={(e) => setIsRecorrente(e.target.checked)}
              />
              <RefreshCw
                size={16}
                color={isRecorrente ? "#C74B67" : "#64748B"}
              />
              Tornar agendamento recorrente
            </label>

            {isRecorrente && (
              <div className="recorrencia-box">
                <label
                  style={{
                    fontSize: "0.85rem",
                    color: "#64748B",
                    marginBottom: "0.5rem",
                    display: "block",
                  }}
                >
                  Intervalo de dias
                </label>
                <div className="opcoes-intervalo">
                  {[7, 21, 28].map((valorOpcao) => (
                    <button
                      key={valorOpcao}
                      type="button"
                      className={`btn-intervalo ${
                        intervalo === valorOpcao ? "ativo" : ""
                      }`}
                      onClick={() => setIntervalo(valorOpcao)}
                    >
                      {valorOpcao} dias
                    </button>
                  ))}
                </div>

                <div className="datas-recorrencia">
                  <div
                    className="form-grupo"
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <label>Data Inicial *</label>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      required={isRecorrente}
                    />
                  </div>
                  <div
                    className="form-grupo"
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <label>Data Final *</label>
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      required={isRecorrente}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn-salvar"
            style={{ marginTop: "1.5rem" }}
          >
            Confirmar Agendamento
          </button>
        </form>
      </div>
    </div>
  );
}
