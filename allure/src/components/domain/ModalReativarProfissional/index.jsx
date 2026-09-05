import React from "react";
import { UserCheck, AlertCircle, Mail, X, ShieldAlert } from "lucide-react";
import "./ModalReativarProfissional.css";

export function ModalReativarProfissional({
  isOpen,
  email,
  nome,
  tipo = "reativar", // "reativar" ou "ja_na_equipe"
  profNome = "",
  isSalvando = false,
  onConfirmar,
  onCancelar,
}) {
  if (!isOpen) return null;

  const isJaCadastrado = tipo === "ja_na_equipe";

  return (
    <div className="modal-reativar-overlay" onClick={onCancelar}>
      <div
        className="modal-reativar-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-reativar-fechar"
          onClick={onCancelar}
          title="Fechar"
        >
          <X size={18} />
        </button>

        <div
          className={`modal-reativar-icon ${
            isJaCadastrado ? "icon-aviso" : "icon-reativar"
          }`}
        >
          {isJaCadastrado ? (
            <ShieldAlert size={32} strokeWidth={2.2} />
          ) : (
            <UserCheck size={32} strokeWidth={2.2} />
          )}
        </div>

        <h3 className="modal-reativar-titulo">
          {isJaCadastrado ? "E-mail Já em Uso" : "Login Já Registrado"}
        </h3>

        <div className="modal-reativar-email-badge">
          <Mail size={15} />
          <span>{email}</span>
        </div>

        <p className="modal-reativar-texto">
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
          <div className="modal-reativar-dica">
            <p>
              Deseja reativar o cadastro de <strong>{nome || "este profissional"}</strong> com este e-mail?
            </p>
            <span>
              💡 O profissional poderá entrar usando a senha que já havia sido definida anteriormente para este e-mail.
            </span>
          </div>
        )}

        <div className="modal-reativar-botoes">
          <button
            type="button"
            className="btn-reativar-cancelar"
            onClick={onCancelar}
            disabled={isSalvando}
          >
            {isJaCadastrado ? "Fechar" : "Trocar E-mail"}
          </button>
          <button
            type="button"
            className="btn-reativar-confirmar"
            onClick={onConfirmar}
            disabled={isSalvando}
          >
            {isSalvando
              ? "Reativando..."
              : isJaCadastrado
                ? "Editar Profissional"
                : "Sim, Reativar Perfil"}
          </button>
        </div>
      </div>
    </div>
  );
}

