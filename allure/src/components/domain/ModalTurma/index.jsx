import { useEffect } from "react";
import { X, Calendar, DollarSign, Users, User, Clock, Bookmark } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "../../../lib/toast";

const turmaSchema = z.object({
  curso_id: z.string().min(1, "Selecione o curso"),
  identificador: z.string().trim().min(2, "Informe a identificação da turma (ex: Turma 01, Turma Março)"),
  data_inicio: z.string().min(1, "Informe a data de início"),
  data_fim: z.string().optional(),
  horario: z.string().optional(),
  instrutor_id: z.string().optional(),
  valor_turma: z.string().min(1, "Informe o valor da turma"),
  vagas_totais: z.string().min(1, "Informe a quantidade de vagas"),
  status: z.enum(["aberta", "em_andamento", "concluida", "cancelada"]),
  observacoes: z.string().optional(),
});

export function ModalTurma({
  isOpen,
  onClose,
  turma,
  cursos = [],
  instrutores = [],
  onSalvar,
  isSalvando,
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(turmaSchema),
    defaultValues: {
      curso_id: "",
      identificador: "",
      data_inicio: "",
      data_fim: "",
      horario: "09:00 às 18:00",
      instrutor_id: "",
      valor_turma: "",
      vagas_totais: "8",
      status: "aberta",
      observacoes: "",
    },
  });

  const selectedCursoId = watch("curso_id");

  // Prefill default course price and seats when selecting a course (if creating new)
  useEffect(() => {
    if (!turma && selectedCursoId) {
      const cursoEncontrado = cursos.find((c) => c.id === selectedCursoId);
      if (cursoEncontrado) {
        if (cursoEncontrado.valor_padrao) {
          setValue(
            "valor_turma",
            String(cursoEncontrado.valor_padrao).replace(".", ",")
          );
        }
        if (cursoEncontrado.vagas_padrao) {
          setValue("vagas_totais", String(cursoEncontrado.vagas_padrao));
        }
      }
    }
  }, [selectedCursoId, turma, cursos, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (turma) {
        reset({
          curso_id: turma.curso_id || "",
          identificador: turma.identificador || "",
          data_inicio: turma.data_inicio || "",
          data_fim: turma.data_fim || "",
          horario: turma.horario || "09:00 às 18:00",
          instrutor_id: turma.instrutor_id || "",
          valor_turma: turma.valor_turma
            ? String(turma.valor_turma).replace(".", ",")
            : "",
          vagas_totais: turma.vagas_totais ? String(turma.vagas_totais) : "8",
          status: turma.status || "aberta",
          observacoes: turma.observacoes || "",
        });
      } else {
        reset({
          curso_id: cursos[0]?.id || "",
          identificador: "",
          data_inicio: "",
          data_fim: "",
          horario: "09:00 às 18:00",
          instrutor_id: "",
          valor_turma: cursos[0]?.valor_padrao
            ? String(cursos[0].valor_padrao).replace(".", ",")
            : "",
          vagas_totais: cursos[0]?.vagas_padrao
            ? String(cursos[0].vagas_padrao)
            : "8",
          status: "aberta",
          observacoes: "",
        });
      }
    }
  }, [turma, isOpen, cursos, reset]);

  if (!isOpen) return null;

  const onSubmit = async (dados) => {
    try {
      const valorNum = dados.valor_turma
        ? Number(dados.valor_turma.replace(/\./g, "").replace(",", "."))
        : 0;

      const payload = {
        curso_id: dados.curso_id,
        identificador: dados.identificador.trim(),
        data_inicio: dados.data_inicio,
        data_fim: dados.data_fim || null,
        horario: dados.horario?.trim() || null,
        instrutor_id: dados.instrutor_id || null,
        valor_turma: isNaN(valorNum) ? 0 : valorNum,
        vagas_totais: Math.max(1, parseInt(dados.vagas_totais, 10) || 8),
        status: dados.status,
        observacoes: dados.observacoes?.trim() || null,
      };

      await onSalvar(payload);
      toast.success(
        turma ? "Turma atualizada com sucesso!" : "Turma aberta com sucesso!"
      );
      onClose();
    } catch (err) {
      console.error("Erro ao salvar turma:", err);
      toast.error("Ocorreu um erro ao salvar a turma.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {turma ? "Editar Turma" : "Abrir Nova Turma"}
              </h3>
              <p className="text-xs text-slate-500">
                Defina as datas, o valor específico e o limite de vagas
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
          {/* Curso Base */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Curso Base *
            </label>
            <select
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                errors.curso_id ? "border-rose-400" : "border-slate-200"
              }`}
              {...register("curso_id")}
              disabled={Boolean(turma)}
            >
              <option value="">Selecione um curso...</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.carga_horaria ? `(${c.carga_horaria})` : ""}
                </option>
              ))}
            </select>
            {errors.curso_id && (
              <span className="text-xs text-rose-500 mt-1 block">{errors.curso_id.message}</span>
            )}
          </div>

          {/* Identificador da Turma */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Bookmark size={13} className="text-slate-400" />
              Identificador da Turma *
            </label>
            <input
              type="text"
              placeholder="Ex: Turma Março/2026 ou Turma VIP"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                errors.identificador ? "border-rose-400" : "border-slate-200"
              }`}
              {...register("identificador")}
            />
            {errors.identificador && (
              <span className="text-xs text-rose-500 mt-1 block">{errors.identificador.message}</span>
            )}
          </div>

          {/* Grid Datas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Data de Início *
              </label>
              <input
                type="date"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                  errors.data_inicio ? "border-rose-400" : "border-slate-200"
                }`}
                {...register("data_inicio")}
              />
              {errors.data_inicio && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.data_inicio.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Data de Término (Opcional)
              </label>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                {...register("data_fim")}
              />
            </div>
          </div>

          {/* Grid Horário e Instrutor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock size={13} className="text-slate-400" />
                Horário das Aulas
              </label>
              <input
                type="text"
                placeholder="Ex: 09:00 às 18:00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                {...register("horario")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <User size={13} className="text-slate-400" />
                Instrutor(a) Responsável
              </label>
              <select
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                {...register("instrutor_id")}
              >
                <option value="">Selecione da equipe (opcional)...</option>
                {instrutores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {p.especialidade ? `(${p.especialidade})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid Valor, Vagas e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <DollarSign size={13} className="text-slate-400" />
                Valor da Turma (R$) *
              </label>
              <input
                type="text"
                placeholder="Ex: 1.500,00"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                  errors.valor_turma ? "border-rose-400" : "border-slate-200"
                }`}
                {...register("valor_turma")}
              />
              {errors.valor_turma && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.valor_turma.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Users size={13} className="text-slate-400" />
                Vagas Totais *
              </label>
              <input
                type="number"
                min="1"
                placeholder="8"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                  errors.vagas_totais ? "border-rose-400" : "border-slate-200"
                }`}
                {...register("vagas_totais")}
              />
              {errors.vagas_totais && (
                <span className="text-xs text-rose-500 mt-1 block">{errors.vagas_totais.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Status da Turma
              </label>
              <select
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                {...register("status")}
              >
                <option value="aberta">Aberta</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Observações / Avisos da Turma
            </label>
            <textarea
              rows="2"
              placeholder="Instruções para as alunas, material a trazer..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition resize-none"
              {...register("observacoes")}
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
              {isSalvando ? "Salvando..." : turma ? "Salvar Alterações" : "Salvar Turma"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

