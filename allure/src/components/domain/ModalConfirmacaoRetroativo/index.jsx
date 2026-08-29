import { AlertTriangle, Clock, Calendar } from "lucide-react";
import { Modal } from "../../ui/Modal";
import Button from "../../ui/Button";

export function ModalConfirmacaoRetroativo({
  isOpen,
  dataStr,
  horaStr,
  onConfirmar,
  onCancelar,
}) {
  const dataFormatada = dataStr
    ? dataStr.split("-").reverse().join("/")
    : "";

  return (
    <Modal isOpen={isOpen} onClose={onCancelar}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
          <AlertTriangle size={32} strokeWidth={2.2} />
        </div>

        <h3 className="text-xl font-bold text-slate-800">Horário no Passado</h3>

        <p className="text-sm text-slate-600">
          O horário selecionado já se passou. Deseja registrar este atendimento no histórico como um agendamento retroativo?
        </p>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-slate-700 font-semibold text-sm">
          <Calendar size={16} className="text-[var(--cor-primaria)]" />
          <span>{dataFormatada}</span>
          <span className="text-slate-300">•</span>
          <Clock size={16} className="text-[var(--cor-primaria)]" />
          <span>{horaStr}</span>
        </div>

        <div className="flex justify-end gap-3 pt-2 w-full">
          <Button type="button" variant="secondary" onClick={onCancelar} className="w-full sm:w-auto">
            Ajustar Horário
          </Button>
          <Button type="button" variant="primary" onClick={onConfirmar} className="w-full sm:w-auto">
            Confirmar e Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
