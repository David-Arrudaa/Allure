import { AlertTriangle, Clock, Calendar } from "lucide-react";
import "./ModalConfirmacaoRetroativo.css";

export function ModalConfirmacaoRetroativo({
  isOpen,
  dataStr,
  horaStr,
  onConfirmar,
  onCancelar,
}) {
  if (!isOpen) return null;

  const dataFormatada = dataStr
    ? dataStr.split("-").reverse().join("/")
    : "";

  return (
    <div className="modal-retroativo-overlay" onClick={onCancelar}>
      <div
        className="modal-retroativo-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-retroativo-icon">
          <AlertTriangle size={32} strokeWidth={2.2} />
        </div>

        <h3 className="modal-retroativo-titulo">Horário no Passado</h3>

        <p className="modal-retroativo-texto">
          O horário selecionado já se passou. Deseja registrar este atendimento no histórico como um agendamento retroativo?
        </p>

        <div className="modal-retroativo-badge">
          <Calendar size={16} color="var(--cor-primaria, #9b87f5)" />
          <span>{dataFormatada}</span>
          <span style={{ color: "#CBD5E1" }}>•</span>
          <Clock size={16} color="var(--cor-primaria, #9b87f5)" />
          <span>{horaStr}</span>
        </div>

        <div className="modal-retroativo-botoes">
          <button
            type="button"
            className="btn-retroativo-cancelar"
            onClick={onCancelar}
          >
            Ajustar Horário
          </button>
          <button
            type="button"
            className="btn-retroativo-confirmar"
            onClick={onConfirmar}
          >
            Confirmar e Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
