import { Calendar, Plus } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatarDataExibicao, formatarDataInput } from "./utils";

export function AgendaTopbar({
  isLoading,
  qtdAtendimentosDia,
  dataSelecionada,
  setDataSelecionada,
  diaAnterior,
  irParaHoje,
  proximoDia,
  isFiltroAberto,
  setIsFiltroAberto,
  profissionais,
  profissionaisSelecionados,
  setProfissionaisSelecionados,
  setAgendamentoEditando,
  setIsModalOpen
}) {
  const dataSelecionadaString = formatarDataInput(dataSelecionada);

  return (
    <div className="flex justify-between items-center mb-4 pb-4 border-b border-[var(--cor-borda)] flex-wrap gap-4 max-md:flex-col max-md:items-start max-md:flex-shrink-0 max-md:mb-3 max-md:pb-3">
      <div className="flex items-center gap-8 flex-wrap max-md:w-full max-md:justify-between">
        <div className="agenda-info">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <h2 className="m-0 text-[var(--cor-texto)] text-2xl font-bold tracking-tight">Agenda do Dia</h2>
            <div
              style={{
                backgroundColor: "#F1F5F9",
                color: "#475569",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
              }}
            >
              {isLoading ? (
                <Skeleton width="60px" height="12px" />
              ) : (
                `${qtdAtendimentosDia} ${qtdAtendimentosDia === 1 ? "agendamento" : "agendamentos"}`
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[0.95rem] text-slate-500 mt-1">
            {formatarDataExibicao(dataSelecionada)}
            <label className="cursor-pointer text-[var(--cor-primaria)] flex items-center justify-center relative bg-pink-50 p-1.5 rounded-md transition-colors duration-200 hover:bg-pink-200 max-md:w-7 max-md:h-7" title="Escolher data">
              <Calendar size={18} />
              <input
                type="date"
                className="opacity-0 absolute w-full h-full cursor-pointer left-0 top-0"
                value={dataSelecionadaString}
                onChange={(e) => {
                  if (e.target.value) {
                    const [ano, mes, dia] = e.target.value.split("-");
                    setDataSelecionada(new Date(ano, mes - 1, dia));
                  }
                }}
              />
            </label>
          </div>
        </div>

        <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button className="bg-white border border-transparent py-1.5 px-3 rounded-md text-[0.85rem] font-semibold text-slate-600 cursor-pointer transition-all duration-200 hover:border-slate-300 hover:text-[var(--cor-primaria)]" onClick={diaAnterior}>&lt; Anterior</button>
          <button className="bg-white border border-transparent py-1.5 px-3 rounded-md text-[0.85rem] font-semibold text-slate-600 cursor-pointer transition-all duration-200 hover:border-slate-300 hover:text-[var(--cor-primaria)]" onClick={irParaHoje}>Hoje</button>
          <button className="bg-white border border-transparent py-1.5 px-3 rounded-md text-[0.85rem] font-semibold text-slate-600 cursor-pointer transition-all duration-200 hover:border-slate-300 hover:text-[var(--cor-primaria)]" onClick={proximoDia}>Próxima &gt;</button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px", width: "100%" }} className="max-md:flex-col">
          <div style={{ position: "relative" }} className="max-md:w-full">
            <button
              className="py-[0.8rem] px-6 rounded-xl text-[0.95rem] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 max-md:w-full bg-slate-50 text-slate-800 border border-slate-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)]"
              onClick={(e) => { e.stopPropagation(); setIsFiltroAberto(!isFiltroAberto); }}
            >
              Filtro Profissionais
            </button>
            {isFiltroAberto && (
              <div
                style={{ position: "absolute", top: "100%", right: 0, marginTop: "4px", backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "12px", zIndex: 1000, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "10px", minWidth: "180px" }}
                onClick={(e) => e.stopPropagation()}
                className="max-md:right-auto max-md:left-0"
              >
                <strong style={{ fontSize: "0.85rem", color: "#1E293B", borderBottom: "1px solid #E2E8F0", paddingBottom: "4px", marginBottom: "4px" }}>Exibir colunas:</strong>
                {profissionais.map((p) => (
                  <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer", color: "#475569" }}>
                    <input
                      type="checkbox"
                      checked={profissionaisSelecionados.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProfissionaisSelecionados([...profissionaisSelecionados, p.id]);
                        } else {
                          setProfissionaisSelecionados(profissionaisSelecionados.filter(id => id !== p.id));
                        }
                      }}
                    />
                    {p.nome}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            className="bg-gradient-to-br from-[var(--cor-primaria)] to-[#a03c53] text-white border-none py-[0.8rem] px-6 rounded-xl text-[0.95rem] font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_4px_12px_rgba(199,75,103,0.2)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(199,75,103,0.3)] max-md:w-full"
            onClick={() => {
              setAgendamentoEditando(null);
              setIsModalOpen(true);
            }}
            disabled={isLoading}
          >
            <Plus size={20} /> Novo Agendamento
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", fontWeight: "600", color: "#64748B" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#EFF6FF", border: "1px solid #3B82F6", borderRadius: "50%" }}></div> Agendado
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#F0FDF4", border: "1px solid #22C55E", borderRadius: "50%" }}></div> Confirmado
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#F5F3FF", border: "1px solid #8B5CF6", borderRadius: "50%" }}></div> Pago
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#FEF2F2", border: "1px solid #EF4444", borderRadius: "50%" }}></div> Cancelado
          </span>
        </div>
      </div>
    </div>
  );
}
