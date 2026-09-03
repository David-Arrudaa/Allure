import { Calendar, Plus, Users, ChevronDown, Filter } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Skeleton } from "../../components/ui/Skeleton";
import Button from "../../components/ui/Button";
import { DatePickerPopover } from "../../components/ui/DatePickerPopover";
import { formatarDataExibicao } from "./utils";

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
  const [isDatePickerAberto, setIsDatePickerAberto] = useState(false);
  const filtroProfRef = useRef(null);

  useEffect(() => {
    const handleClickForaFiltro = (e) => {
      if (filtroProfRef.current && !filtroProfRef.current.contains(e.target)) {
        setIsFiltroAberto(false);
      }
    };
    document.addEventListener("mousedown", handleClickForaFiltro);
    return () => document.removeEventListener("mousedown", handleClickForaFiltro);
  }, [setIsFiltroAberto]);

  const toggleProfissional = (id) => {
    setProfissionaisSelecionados((prev) => {
      const novos = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      return novos;
    });
  };

  const selecionarTodas = () => {
    setProfissionaisSelecionados(profissionais.map((p) => p.id));
  };

  const desmarcarTodas = () => {
    setProfissionaisSelecionados([]);
  };

  return (
    <div className="flex justify-between items-center mb-4 pb-4 border-b border-[var(--cor-borda)] flex-wrap gap-4 max-md:flex-col max-md:items-start max-md:flex-shrink-0 max-md:mb-3 max-md:pb-3">
      <div className="flex items-center gap-8 flex-wrap max-md:w-full max-md:justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-[var(--cor-texto)] text-2xl font-bold tracking-tight">Agenda do Dia</h2>
            <div className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-bold flex items-center">
              {isLoading ? (
                <Skeleton width="60px" height="12px" />
              ) : (
                `${qtdAtendimentosDia} ${qtdAtendimentosDia === 1 ? "agendamento" : "agendamentos"}`
              )}
            </div>
          </div>

          <div className="relative">
            <div
              className="flex items-center gap-3 text-[0.95rem] text-slate-500 mt-1 cursor-pointer group"
              onClick={() => setIsDatePickerAberto(!isDatePickerAberto)}
              title="Clique para escolher a data"
            >
              <span className="font-medium text-slate-700 group-hover:text-[var(--cor-primaria)] transition-colors">{formatarDataExibicao(dataSelecionada)}</span>
              <button
                type="button"
                className="text-[var(--cor-primaria)] flex items-center justify-center bg-pink-50 p-1.5 rounded-md transition-colors duration-200 hover:bg-pink-200 max-md:w-7 max-md:h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDatePickerAberto(!isDatePickerAberto);
                }}
                title="Abrir calendário"
              >
                <Calendar size={18} />
              </button>
            </div>
            <DatePickerPopover
              isOpen={isDatePickerAberto}
              onClose={() => setIsDatePickerAberto(false)}
              dataSelecionada={dataSelecionada}
              onSelectData={(novaData) => setDataSelecionada(novaData)}
            />
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
          <div style={{ position: "relative" }} className="max-md:w-full" ref={filtroProfRef}>
            <Button
              variant="secondary"
              className={`max-md:w-full flex items-center gap-2 ${isFiltroAberto ? 'bg-slate-100 border-slate-300' : ''}`}
              onClick={(e) => { e.stopPropagation(); setIsFiltroAberto(!isFiltroAberto); }}
            >
              <Users size={16} />
              <span>Profissionais</span>
              <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-xs ml-1">
                {profissionais.length > 0 && profissionaisSelecionados.length === profissionais.length
                  ? `Todas (${profissionais.length})`
                  : `${profissionaisSelecionados.length}/${profissionais.length}`}
              </span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isFiltroAberto ? 'rotate-180' : ''}`} />
            </Button>
            {isFiltroAberto && (
              <div
                className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg p-0 z-[1000] shadow-lg flex flex-col min-w-[240px] max-md:right-auto max-md:left-0"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-slate-50 rounded-t-lg">
                  <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                    <Filter size={15} />
                    <span>Filtrar Equipe</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={selecionarTodas} className="text-slate-500 hover:text-[var(--cor-primaria)] font-medium transition-colors">Todas</button>
                    <button type="button" onClick={desmarcarTodas} className="text-slate-500 hover:text-[var(--cor-primaria)] font-medium transition-colors">Nenhuma</button>
                  </div>
                </div>

                <div className="max-h-[300px] overflow-y-auto p-2 flex flex-col gap-1">
                  {profissionais.map((p) => {
                    const isChecked = profissionaisSelecionados.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors text-sm ${isChecked ? 'bg-[var(--cor-primaria-light)] text-[var(--cor-primaria)] font-medium' : 'hover:bg-slate-50 text-slate-600'}`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-[var(--cor-primaria)] focus:ring-[var(--cor-primaria)]"
                          checked={isChecked}
                          onChange={() => toggleProfissional(p.id)}
                        />
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 text-xs font-bold border border-slate-200">
                          {p.foto ? (
                            <img src={p.foto} alt={p.nome} className="w-full h-full object-cover" />
                          ) : (
                            <span>{p.nome.charAt(0)}</span>
                          )}
                        </div>
                        <span className="truncate">{p.nome}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="p-2 border-t border-slate-100 text-xs text-center text-slate-500 bg-slate-50 rounded-b-lg">
                  Exibindo {profissionaisSelecionados.length} de {profissionais.length} profissionais
                </div>
              </div>
            )}
          </div>
          <Button
            variant="primary"
            className="max-md:w-full"
            onClick={() => {
              setAgendamentoEditando(null);
              setIsModalOpen(true);
            }}
            disabled={isLoading}
          >
            <Plus size={20} /> Novo Agendamento
          </Button>
        </div>

        <div style={{ display: "flex", gap: "12px", fontSize: "0.75rem", fontWeight: "600", color: "#64748B" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#FEF9C3", border: "1px solid #CA8A04", borderRadius: "50%" }}></div> Agendado
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#DBEAFE", border: "1px solid #2563EB", borderRadius: "50%" }}></div> Confirmado
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#DCFCE7", border: "1px solid #16A34A", borderRadius: "50%" }}></div> Pago
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#FEF2F2", border: "1px solid #EF4444", borderRadius: "50%" }}></div> Cancelado
          </span>
        </div>
      </div>
    </div>
  );
}
