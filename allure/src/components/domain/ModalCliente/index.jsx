import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useClientes } from "../../../hooks/useClientes";
import { Modal } from "../../ui/Modal";
import Button from "../../ui/Button";
import { FORM_STYLES } from "../../../config/theme";

const clienteSchema = z.object({
  nome: z.string().min(3, "O nome deve ter no mínimo 3 caracteres").max(255, "Máximo de 255 caracteres"),
  telefone: z.string().min(14, "Telefone inválido").max(15, "Telefone inválido"),
  eWhatsApp: z.boolean().default(false),
  aniversario: z.string().optional(),
  observacoes: z.string().max(1000, "Máximo de 1000 caracteres").optional(),
});

const applyPhoneMask = (value) => {
  if (!value) return "";
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 2) return clean;
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
};

const extrairAniversario = (observacoes) => {
  if (!observacoes) return "";
  const match = observacoes.match(/(?:Nascimento|Anivers[áa]rio):\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4})/i);
  if (match) {
    const val = match[1];
    if (val.includes("/")) {
      const [d, m, y] = val.split("/");
      return `${y}-${m}-${d}`;
    }
    return val;
  }
  return "";
};

const montarObservacoesComAniversario = (obsExistente, dataNasc) => {
  const obsLimpa = (obsExistente || "")
    .replace(/(?:\[)?(?:Nascimento|Anivers[áa]rio):\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4})(?:\])?\n?/gi, "")
    .trim();
  if (!dataNasc) return obsLimpa;
  return obsLimpa ? `${obsLimpa}\nNascimento: ${dataNasc}` : `Nascimento: ${dataNasc}`;
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
          aniversario: cliente.aniversario || extrairAniversario(cliente.observacoes),
          observacoes: (cliente.observacoes || "").replace(/(?:\[)?(?:Nascimento|Anivers[áa]rio):\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4})(?:\])?\n?/gi, "").trim(),
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
        observacoes: montarObservacoesComAniversario(dadosCliente.observacoes, dadosCliente.aniversario),
      };

      if (cliente && cliente.id) {
        await atualizarCliente({ id: cliente.id, payload });
        toast.success("Cliente atualizado com sucesso!");
      } else {
        await criarCliente(payload);
        toast.success("Cliente cadastrado com sucesso!");
      }

      reset();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error.message);
      toast.error(`Erro ao salvar cliente: ${error.message}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={cliente ? "Editar Cliente" : "Nova Cliente"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
        <div className={FORM_STYLES.group}>
          <label className={FORM_STYLES.label}>Nome Completo *</label>
          <input
            type="text"
            placeholder="Ex: Mariana Souza"
            autoComplete="off"
            className={FORM_STYLES.input}
            {...register("nome")}
            onChange={(e) => {
              e.target.value = formatarNome(e.target.value);
              register("nome").onChange(e);
            }}
          />
          {errors.nome && <span className={FORM_STYLES.error}>{errors.nome.message}</span>}
        </div>

        <div className={FORM_STYLES.row}>
          <div className={FORM_STYLES.group}>
            <label className={FORM_STYLES.label}>Telefone *</label>
            <Controller
              name="telefone"
              control={control}
              render={({ field: { onChange, value } }) => (
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={value}
                  autoComplete="off"
                  className={FORM_STYLES.input}
                  onChange={(e) => onChange(applyPhoneMask(e.target.value))}
                />
              )}
            />
            {errors.telefone && <span className={FORM_STYLES.error}>{errors.telefone.message}</span>}
            <label className="flex items-center gap-2 mt-1 text-sm text-slate-600 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[var(--cor-primaria)] focus:ring-[var(--cor-primaria)] cursor-pointer" {...register("eWhatsApp")} />
              É WhatsApp
            </label>
          </div>

          <div className={FORM_STYLES.group}>
            <label className={FORM_STYLES.label}>Data de Nascimento</label>
            <input
              type="date"
              className={FORM_STYLES.input}
              {...register("aniversario")}
            />
          </div>
        </div>

        <div className={FORM_STYLES.group}>
          <label className={FORM_STYLES.label}>Observações (Alergias, preferências, etc)</label>
          <textarea
            placeholder="Digite aqui informações importantes sobre a cliente..."
            className={FORM_STYLES.textarea}
            {...register("observacoes")}
          />
          {errors.observacoes && <span className={FORM_STYLES.error}>{errors.observacoes.message}</span>}
        </div>

        <div className={FORM_STYLES.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSalvando}>
            {isSalvando ? "Salvando..." : cliente ? "Salvar Alterações" : "Salvar Cadastro"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
