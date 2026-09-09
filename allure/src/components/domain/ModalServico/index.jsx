import { useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useServicos } from "../../../hooks/useServicos";
import { toast } from "../../../lib/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const servicoSchema = z.object({
  nome: z.string().trim().min(4, "O nome do serviço deve ter no mínimo 4 caracteres"),
  preco: z.string().refine((val) => {
    const num = Number(val.replace(",", "."));
    return num > 1;
  }, "O valor deve ser acima de R$ 1,00"),
});

export function ModalServico({ isOpen, onClose, servico }) {
  const { profile } = useAuth();
  const { criarServico, atualizarServico, isSalvando } = useServicos();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      nome: "",
      preco: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (servico) {
        reset({
          nome: servico.nome || "",
          preco: servico.preco ? String(servico.preco).replace(".", ",") : "",
        });
      } else {
        reset({
          nome: "",
          preco: "",
        });
      }
    }
  }, [servico, isOpen, reset]);

  if (!isOpen) return null;

  const formatarNome = (texto) => {
    return texto.toLowerCase().replace(/(?:^|\s)\S/g, function (letra) {
      return letra.toUpperCase();
    });
  };

  const onSubmit = async (dadosServico) => {
    try {
      const precoNumerico = Number(dadosServico.preco.replace(",", "."));

      const payload = {
        nome: formatarNome(dadosServico.nome),
        preco: precoNumerico,
        tenant_id: profile?.tenant_id || "11111111-1111-1111-1111-111111111111",
      };

      if (servico && servico.id) {
        await atualizarServico({ id: servico.id, payload });
        toast.success("Serviço atualizado com sucesso!");
      } else {
        await criarServico(payload);
        toast.success("Serviço cadastrado com sucesso!");
      }

      onClose();
    } catch (error) {
      console.error("Erro ao salvar serviço:", error.message);
      toast.error(`Erro ao salvar serviço: ${error.message || "Tente novamente"}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-[92%] max-w-[480px] p-8 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] flex flex-col animate-[modalAparecer_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
          <h2 className="text-xl font-bold text-[var(--cor-texto)] m-0">
            {servico ? "Editar Serviço" : "Novo Serviço"}
          </h2>
          <button
            type="button"
            className="btn-fechar"
            onClick={onClose}
            title="Fechar"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-600">Nome do Serviço *</label>
            <input
              type="text"
              placeholder="Ex: Escova Modeladora"
              {...register("nome")}
              onChange={(e) => {
                e.target.value = formatarNome(e.target.value);
                register("nome").onChange(e);
              }}
              className="w-full py-3 px-4 border border-slate-300 rounded-lg text-[0.95rem] text-[var(--cor-texto)] bg-slate-50 outline-none transition-all focus:border-[var(--cor-primaria)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
            />
            {errors.nome && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.nome.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-sm font-semibold text-slate-600">Valor (R$) *</label>
            <input
              type="text"
              placeholder="Ex: 80,00"
              {...register("preco")}
              className="w-full py-3 px-4 border border-slate-300 rounded-lg text-[0.95rem] text-[var(--cor-texto)] bg-slate-50 outline-none transition-all focus:border-[var(--cor-primaria)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
            />
            {errors.preco && (
              <span className="text-red-500 text-xs mt-1 block">
                {errors.preco.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn-salvar mt-4 py-3.5 px-6 text-base font-semibold rounded-lg"
            disabled={isSalvando}
          >
            {isSalvando
              ? "Salvando..."
              : servico
                ? "Salvar Alterações"
                : "Salvar Serviço"}
          </button>
        </form>
      </div>
    </div>
  );
}
