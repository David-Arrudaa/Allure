import { useEffect } from "react";
import { X, GraduationCap, Clock, DollarSign, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "../../../lib/toast";

const cursoSchema = z.object({
  nome: z.string().trim().min(3, "O nome do curso deve ter no mínimo 3 caracteres"),
  descricao: z.string().optional(),
  carga_horaria: z.string().optional(),
  valor_padrao: z.string().optional(),
  vagas_padrao: z.string().optional(),
});

export function ModalCurso({ isOpen, onClose, curso, onSalvar, isSalvando }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      carga_horaria: "",
      valor_padrao: "",
      vagas_padrao: "8",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (curso) {
        reset({
          nome: curso.nome || "",
          descricao: curso.descricao || "",
          carga_horaria: curso.carga_horaria || "",
          valor_padrao: curso.valor_padrao ? String(curso.valor_padrao).replace(".", ",") : "",
          vagas_padrao: curso.vagas_padrao ? String(curso.vagas_padrao) : "8",
        });
      } else {
        reset({
          nome: "",
          descricao: "",
          carga_horaria: "",
          valor_padrao: "",
          vagas_padrao: "8",
        });
      }
    }
  }, [curso, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (dados) => {
    try {
      const valorNumerico = dados.valor_padrao
        ? Number(dados.valor_padrao.replace(/\./g, "").replace(",", "."))
        : 0;

      const payload = {
        nome: dados.nome.trim(),
        descricao: dados.descricao?.trim() || null,
        carga_horaria: dados.carga_horaria?.trim() || null,
        valor_padrao: isNaN(valorNumerico) ? 0 : valorNumerico,
        vagas_padrao: Math.max(1, parseInt(dados.vagas_padrao, 10) || 8),
      };

      await onSalvar(payload);
      toast.success(curso ? "Curso atualizado com sucesso!" : "Curso criado com sucesso!");
      onClose();
    } catch (err) {
      console.error("Erro ao salvar curso:", err);
      toast.error("Ocorreu um erro ao salvar o curso.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <GraduationCap size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {curso ? "Editar Curso Base" : "Novo Curso Base"}
              </h3>
              <p className="text-xs text-slate-500">
                Cadastre o modelo do curso para depois agendar turmas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome do Curso *
            </label>
            <input
              type="text"
              placeholder="Ex: Especialização em Mechas & Loiros"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                errors.nome ? "border-rose-400 focus:ring-rose-400" : "border-slate-200"
              }`}
              {...register("nome")}
            />
            {errors.nome && (
              <span className="text-xs text-rose-500 mt-1 block">{errors.nome.message}</span>
            )}
          </div>

          {/* Grid: Carga horária, Valor Padrão, Vagas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock size={13} className="text-slate-400" />
                Carga Horária
              </label>
              <input
                type="text"
                placeholder="Ex: 16h / 2 dias"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                {...register("carga_horaria")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <DollarSign size={13} className="text-slate-400" />
                Valor Base (R$)
              </label>
              <input
                type="text"
                placeholder="Ex: 1.500,00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                {...register("valor_padrao")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Users size={13} className="text-slate-400" />
                Vagas Padrão
              </label>
              <input
                type="number"
                min="1"
                placeholder="8"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                {...register("vagas_padrao")}
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Descrição / Conteúdo Programático
            </label>
            <textarea
              rows="3"
              placeholder="Descreva as técnicas ensinadas, materiais inclusos, requisitos..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
              {...register("descricao")}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSalvando}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSalvando}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-md shadow-purple-600/20 transition disabled:opacity-50"
            >
              {isSalvando ? "Salvando..." : curso ? "Salvar Alterações" : "Criar Curso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

