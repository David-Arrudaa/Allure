import React from "react";
import { UserCheck, Mail, ShieldAlert } from "lucide-react";
import { Modal } from "../../ui/Modal";
import Button from "../../ui/Button";
import { FORM_STYLES } from "../../../config/theme";

export function ModalReativarProfissional({
  isOpen,
  email,
  nome,
  tipo = "reativar",
  profNome = "",
  isSalvando = false,
  onConfirmar,
  onCancelar,
}) {
  const isJaCadastrado = tipo === "ja_na_equipe";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancelar}
      title={isJaCadastrado ? "E-mail Já em Uso" : "Login Já Registrado"}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
          isJaCadastrado ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-500"
        }`}>
          {isJaCadastrado ? (
            <ShieldAlert size={32} strokeWidth={2.2} />
          ) : (
            <UserCheck size={32} strokeWidth={2.2} />
          )}
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-slate-700 font-medium text-xs">
          <Mail size={14} className="text-slate-500" />
          <span>{email}</span>
        </div>

        <p className="text-sm text-slate-600">
          {isJaCadastrado ? (
            <>
              O e-mail informado já pertence a <strong>{profNome}</strong>, que está ativa(o) na equipe do seu salão.
            </>
          ) : (
            <>
              Este e-mail já possui uma conta de acesso registrada no sistema (de um cadastro anterior).
            </>
          )}
        </p>

        {!isJaCadastrado && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-left space-y-1 w-full">
            <p className="text-xs font-semibold text-amber-900">
              Deseja reativar o cadastro de <strong>{nome || "este profissional"}</strong> com este e-mail?
            </p>
            <span className="text-[0.75rem] text-amber-700 block">
              💡 O profissional poderá entrar usando a senha que já havia sido definida anteriormente.
            </span>
          </div>
        )}

        <div className={`w-full ${FORM_STYLES.actions}`}>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancelar}
            disabled={isSalvando}
          >
            {isJaCadastrado ? "Fechar" : "Trocar E-mail"}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirmar}
            disabled={isSalvando}
          >
            {isSalvando
              ? "Reativando..."
              : isJaCadastrado
                ? "Editar Profissional"
                : "Sim, Reativar Perfil"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
