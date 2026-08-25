import { useEffect } from "react";
import { X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useClientes } from "../../../hooks/useClientes";
import "./ModalCliente.css";
// import "../ModalAgendamento/ModalAgendamento.css";

const clienteSchema = z.object({
  nome: z.string().min(3, "O nome deve ter no mínimo 3 caracteres").max(255, "Máximo de 255 caracteres"),
  telefone: z.string().min(14, "Telefone inválido").max(15, "Telefone inválido"),
  eWhatsApp: z.boolean().default(false),
  aniversario: z.string().optional(),
  observacoes: z.string().max(1000, "Máximo de 1000 caracteres").optional(),
});

const applyPhoneMask = (value) => {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 2) return clean;
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
};

export function ModalCliente({ isOpen, onClose, cliente }) {
  const { criarCliente, atualizarCliente, isSalvando } = useClientes();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      eWhatsApp: true,
      aniversario: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (cliente) {
        reset({
          nome: cliente.nome || "",
          telefone: cliente.telefone && cliente.telefone !== "Não informado" ? cliente.telefone : "",
          eWhatsApp: cliente.is_whatsapp ?? true,
          aniversario: cliente.aniversario || "",
          observacoes: cliente.observacoes || "",
        });
      } else {
        reset({
          nome: "",
          telefone: "",
          eWhatsApp: true,
          aniversario: "",
          observacoes: "",
        });
      }
    }
  }, [cliente, isOpen, reset]);

  if (!isOpen) return null;

  const formatarNome = (texto) => {
    return texto.toLowerCase().replace(/(?:^|\s)\S/g, function (letra) {
      return letra.toUpperCase();
    });
  };

  const onSubmit = async (dadosCliente) => {
    try {
      const payload = {
        nome: formatarNome(dadosCliente.nome.trim()),
        telefone: dadosCliente.telefone.trim(),
        is_whatsapp: dadosCliente.eWhatsApp,
        observacoes: dadosCliente.observacoes?.trim() || "",
      };

      if (cliente && cliente.id) {
        await atualizarCliente({ id: cliente.id, payload });
      } else {
        await criarCliente(payload);
      }

      reset();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error.message);
      alert(`Erro ao salvar cliente: ${error.message}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{cliente ? "Editar Cliente" : "Nova Cliente"}</h2>
          <button className="btn-fechar" onClick={onClose} title="Fechar">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="form-cliente">
          <div className="form-grupo">
            <label>Nome Completo *</label>
            <input
              type="text"
              placeholder="Ex: Mariana Souza"
              {...register("nome")}
              onChange={(e) => {
                e.target.value = formatarNome(e.target.value);
                register("nome").onChange(e);
              }}
            />
            {errors.nome && <span className="erro" style={{ color: "red", fontSize: "0.85rem" }}>{errors.nome.message}</span>}
          </div>

          <div className="form-linha-dupla">
            <div className="form-grupo">
              <label>Telefone *</label>
              <Controller
                name="telefone"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={value}
                    onChange={(e) => onChange(applyPhoneMask(e.target.value))}
                  />
                )}
              />
              {errors.telefone && <span className="erro" style={{ color: "red", fontSize: "0.85rem" }}>{errors.telefone.message}</span>}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" {...register("eWhatsApp")} />
                É WhatsApp
              </label>
            </div>

            <div className="form-grupo">
              <label>Data de Nascimento</label>
              <input type="date" {...register("aniversario")} />
            </div>
          </div>

          <div className="form-grupo">
            <label>Observações (Alergias, preferências, etc)</label>
            <textarea
              placeholder="Digite aqui informações importantes sobre a cliente..."
              {...register("observacoes")}
            />
            {errors.observacoes && <span className="erro" style={{ color: "red", fontSize: "0.85rem" }}>{errors.observacoes.message}</span>}
          </div>

          <button type="submit" className="btn-salvar" style={{ marginTop: "1rem" }} disabled={isSalvando}>
            {isSalvando ? "Salvando..." : cliente ? "Salvar Alterações" : "Salvar Cadastro"}
          </button>
        </form>
      </div>
    </div>
  );
}
