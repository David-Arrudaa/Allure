import { useEffect } from "react";
import { RefreshCw, Trash2, AlertOctagon, MoreVertical, CircleDollarSign, Check, X } from "lucide-react";
import { Skeleton } from "../../components/ui/Skeleton";
import { calcularPosicao, determinarCoresAgendamento, calcularHoraFim } from "./utils";

export function CalendarGrid({
  isLoading,
  profissionais,
  profissionaisSelecionados,
  agendamentosDoDia,
  agendamentosOrfaos,
  mostrarLinhaTempo,
  posicaoLinhaTempo,
  linhaTempoRef,
  dataSelecionada,
  setAgendamentoEditando,
  setIsModalOpen,
  setAgendamentoParaExcluir,
  menuAbertoId,
  setMenuAbertoId,
  setAgendamentoParaWhatsApp,
  setIsModalWhatsAppAberto,
  handleAbrirPagamento,
  alterarStatus,
  handleAbrirRecorrencia,
}) {
  const horasDoDia = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

  useEffect(() => {
    if (mostrarLinhaTempo && linhaTempoRef.current) {
      const container = linhaTempoRef.current.closest(".agenda-wrapper");
      if (container) {
        container.scrollTo({
          top: linhaTempoRef.current.offsetTop - container.clientHeight / 2,
          left: 0,
          behavior: "smooth",
        });
      }
    }
  }, [dataSelecionada, mostrarLinhaTempo, linhaTempoRef]);

  return (
    <div className="!flex flex-1 min-h-0 relative bg-slate-50 rounded-xl border border-slate-200 !overflow-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
      <div className="w-[60px] flex-shrink-0 bg-white border-r border-slate-200 !sticky !left-0 !z-30 !min-h-[2974px] shadow-[3px_0_10px_rgba(0,0,0,0.03)]">
        <div className="!sticky !top-0 !left-0 h-[74px] !z-40 !bg-white border-b-2 border-slate-200"></div>
        {horasDoDia.map((hora) => (
          <div key={hora} className="h-[120px] text-right pr-2 text-sm text-slate-500 font-medium relative">
            <span className="absolute -top-2 right-2 bg-white px-1">{hora}</span>
            <span className="absolute top-[60px] right-2 bg-white px-1 text-[0.7rem] text-slate-400 -translate-y-1/2">{hora.replace(":00", ":30")}</span>
          </div>
        ))}
      </div>

      <div className="!flex flex-grow relative bg-[linear-gradient(#e2e8f0_1px,transparent_1px)] bg-[length:100%_60px] bg-[0_74px] !min-h-[2974px] !flex-nowrap !w-full !overflow-visible max-md:!w-max">
        {isLoading
          ? [1, 2, 3].map((col) => (
              <div key={col} className="!flex-1 !min-w-0 border-r border-slate-200 relative !min-h-[2974px] !overflow-visible max-md:!flex-none max-md:!w-[140px] max-md:!min-w-[140px]" style={{ padding: "12px" }}>
                <div className="flex flex-row items-center justify-center gap-2.5 bg-pink-50 p-4 border-b-2 border-pink-200 !sticky !top-0 !z-20 !mt-0 h-[74px] box-border" style={{ marginBottom: "20px" }}>
                  <Skeleton width="40px" height="40px" borderRadius="50%" />
                  <div style={{ marginLeft: "10px" }}><Skeleton width="90px" height="16px" /></div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <Skeleton width="100%" height="90px" borderRadius="10px" />
                  <Skeleton width="100%" height="70px" borderRadius="10px" />
                </div>
              </div>
            ))
          : profissionais.filter(p => profissionaisSelecionados.includes(p.id)).map((prof) => (
              <div key={prof.id} className="!flex-1 !min-w-0 border-r border-slate-200 relative !min-h-[2974px] !overflow-visible max-md:!flex-none max-md:!w-[140px] max-md:!min-w-[140px]">
                <div className="flex flex-row items-center justify-center gap-2.5 bg-pink-50 p-4 border-b-2 border-pink-200 !sticky !top-0 !z-20 !mt-0 h-[74px] box-border">
                  {prof.foto ? (
                    <img src={prof.foto} alt={prof.nome} className="flex-shrink-0 !w-[40px] !h-[40px] rounded-full shadow-sm object-cover" />
                  ) : (
                    <div className="flex-shrink-0 !w-[40px] !h-[40px] rounded-full shadow-sm object-cover bg-gradient-to-br from-[var(--cor-primaria)] to-[#a03c53] text-white flex items-center justify-center text-xl font-bold">{prof.nome.charAt(0)}</div>
                  )}
                  <div className="flex items-center">
                    <h3 className="m-0 text-[0.9rem] font-bold text-[var(--cor-texto,#334155)] whitespace-nowrap max-md:text-[0.85rem] max-md:whitespace-normal max-md:text-center">{prof.nome}</h3>
                  </div>
                </div>

                {agendamentosDoDia
                  .filter((ag) => ag.profissionalId === prof.id)
                  .map((ag) => (
                    <div
                      key={ag.id}
                      className="absolute left-1 right-1 bg-white border border-slate-200 rounded-lg py-2 px-3 flex flex-col border-l-4 border-l-[var(--cor-primaria)] !overflow-visible transition-[box-shadow] duration-200 ease-in z-[2] cursor-pointer hover:!h-max hover:min-h-fit hover:!z-[18] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2),0_8px_10px_-6px_rgba(0,0,0,0.1)] max-md:!py-1 max-md:!px-1.5"
                      onClick={() => {
                        setAgendamentoEditando(ag);
                        setIsModalOpen(true);
                      }}
                      style={{
                        top: `${calcularPosicao(ag.horarioInicio)}px`,
                        height: `${ag.duracao * 2}px`,
                        backgroundColor: determinarCoresAgendamento(ag).bg,
                        borderLeftColor: determinarCoresAgendamento(ag).border,
                      }}
                    >
                      <div className="!flex !flex-nowrap !justify-between !items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <span
                            className="line-clamp-2 break-words leading-tight font-semibold text-[0.95rem] max-md:text-[0.85rem]"
                            title={ag.cliente}
                            style={{
                              color: determinarCoresAgendamento(ag).text || "var(--cor-texto)",
                              textDecoration: ag.status === "cancelado" ? "line-through" : "none",
                            }}
                          >
                            {ag.cliente}
                          </span>
                        </div>

                        <div
                          className="!flex !flex-nowrap items-center !mt-0 !justify-end flex-shrink-0"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onTouchStart={(e) => e.stopPropagation()}
                          onTouchEnd={(e) => e.stopPropagation()}
                          style={{ gap: "4px" }}
                        >
                          {ag.status !== "bloqueio" && (
                            <div
                              style={{
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "0.65rem",
                                fontWeight: "700",
                                backgroundColor: ag.pagamento === "pago" ? "#DCFCE7" : "#FEE2E2",
                                color: ag.pagamento === "pago" ? "#16A34A" : "#EF4444",
                                border: `1px solid ${ag.pagamento === "pago" ? "#bbf7d0" : "#fecaca"}`,
                              }}
                              title={ag.pagamento === "pago" ? "Pago" : "Pendente"}
                            >
                              {ag.pagamento === "pago" ? "PAGO" : "PEND."}
                            </div>
                          )}
                          {ag.status !== "bloqueio" ? (
                            <>
                              <button
                                type="button"
                                className="flex w-[30px] h-[30px] bg-transparent rounded-lg items-center justify-center cursor-pointer border-none text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 max-md:w-7 max-md:h-7"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setMenuAbertoId(menuAbertoId === ag.id ? null : ag.id);
                                }}
                                title="Opções"
                              >
                                <MoreVertical size={20} />
                              </button>

                              {menuAbertoId === ag.id && (
                                <div className="flex flex-col absolute top-8 !right-0 !left-auto !transform-none bg-white border border-slate-300 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.2)] p-1.5 !z-[9999] gap-1 min-w-[180px] animate-in fade-in slide-in-from-top-1">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setAgendamentoParaWhatsApp(ag);
                                      setIsModalWhatsAppAberto(true);
                                      setMenuAbertoId(null);
                                    }}
                                    className="flex items-center gap-2.5 w-full py-2 px-3 bg-white border border-transparent rounded-md text-[0.85rem] font-semibold text-slate-700 no-underline cursor-pointer text-left box-border transition-colors duration-200 hover:bg-slate-100"
                                  >
                                    <span style={{ color: "#22C55E", display: "flex" }}>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                    </span>
                                    Mensagens (WhatsApp)
                                  </button>
                                  <div style={{ height: "1px", backgroundColor: "#E2E8F0", margin: "4px 0" }}></div>
                                  <button
                                    className="flex items-center gap-2.5 w-full py-2 px-3 bg-white border border-transparent rounded-md text-[0.85rem] font-semibold text-slate-700 no-underline cursor-pointer text-left box-border transition-colors duration-200 hover:bg-slate-100"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleAbrirPagamento(ag, e);
                                      setMenuAbertoId(null);
                                    }}
                                  >
                                    <CircleDollarSign size={16} color={ag.pagamento === "pago" ? "#64748B" : "#10B981"} />
                                    {ag.pagamento === "pago" ? "Estornar Pagamento" : "Receber Pagamento"}
                                  </button>
                                  {ag.status !== "cancelado" && (
                                    <button
                                      className="flex items-center gap-2.5 w-full py-2 px-3 bg-white border border-transparent rounded-md text-[0.85rem] font-semibold text-slate-700 no-underline cursor-pointer text-left box-border transition-colors duration-200 hover:bg-slate-100"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        alterarStatus(ag.id, ag.status === "confirmado" ? "pendente" : "confirmado");
                                        setMenuAbertoId(null);
                                      }}
                                    >
                                      <Check size={16} color={ag.status === "confirmado" ? "#F59E0B" : "#22C55E"} />
                                      {ag.status === "confirmado" ? "Remover Confirmação" : "Confirmar Presença"}
                                    </button>
                                  )}
                                  <button
                                    className="flex items-center gap-2.5 w-full py-2 px-3 bg-white border border-transparent rounded-md text-[0.85rem] font-semibold text-slate-700 no-underline cursor-pointer text-left box-border transition-colors duration-200 hover:bg-slate-100"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      alterarStatus(ag.id, ag.status === "cancelado" ? "pendente" : "cancelado");
                                      setMenuAbertoId(null);
                                    }}
                                  >
                                    <X size={16} color={ag.status === "cancelado" ? "#3B82F6" : "#EF4444"} />
                                    {ag.status === "cancelado" ? "Restaurar Agendamento" : "Cancelar Agendamento"}
                                  </button>
                                  <div style={{ height: "1px", backgroundColor: "#E2E8F0", margin: "4px 0" }}></div>
                                  <button
                                    className="flex items-center gap-2.5 w-full py-2 px-3 bg-white border border-transparent rounded-md text-[0.85rem] font-semibold text-red-500 no-underline cursor-pointer text-left box-border transition-colors duration-200 hover:bg-slate-100"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setAgendamentoParaExcluir(ag);
                                      setMenuAbertoId(null);
                                    }}
                                  >
                                    <Trash2 size={16} />
                                    Apagar do Sistema
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setAgendamentoParaExcluir(ag);
                              }}
                              className="flex w-[30px] h-[30px] bg-transparent rounded-lg items-center justify-center cursor-pointer border-none text-red-500 transition-all duration-200 hover:bg-slate-100 hover:text-red-700 max-md:w-7 max-md:h-7"
                              title="Excluir Bloqueio"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 font-medium mb-auto mt-0.5 flex justify-between items-center">
                        <span>
                          {ag.horarioInicio} - {calcularHoraFim(ag.horarioInicio, ag.duracao)}
                        </span>
                        {ag.grupo_recorrencia && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAbrirRecorrencia(ag, e);
                            }}
                            style={{
                              backgroundColor: "#E0F2FE",
                              color: "#0284C7",
                              border: "none",
                              borderRadius: "6px",
                              width: "24px",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              padding: 0,
                            }}
                            title="Ver série"
                          >
                            <RefreshCw size={14} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                      <div className="text-[0.82rem] text-slate-500 mt-auto pt-1 break-words leading-tight !line-clamp-2">
                        <span className="!whitespace-normal !text-clip">{ag.servico}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ))}

        {!isLoading && agendamentosOrfaos.length > 0 && (
          <div className="!flex-1 !min-w-0 border-r border-slate-200 relative !min-h-[2974px] !overflow-visible max-md:!flex-none max-md:!w-[140px] max-md:!min-w-[140px]" style={{ backgroundColor: "#FEF2F2", borderRight: "1px solid #FECACA" }}>
            <div className="flex flex-row items-center justify-center gap-2.5 bg-pink-50 p-4 border-b-2 border-pink-200 !sticky !top-0 !z-20 !mt-0 h-[74px] box-border" style={{ backgroundColor: "#FEE2E2", borderBottom: "1px solid #FECACA" }}>
              <div className="flex-shrink-0 !w-[40px] !h-[40px] rounded-full shadow-sm object-cover bg-gradient-to-br from-[var(--cor-primaria)] to-[#a03c53] text-white flex items-center justify-center text-xl font-bold" style={{ backgroundColor: "#EF4444", color: "#FFFFFF", background: "none" }}>
                <AlertOctagon size={20} strokeWidth={2.5} />
              </div>
              <div className="flex items-center">
                <h3 className="m-0 text-[0.9rem] font-bold text-[var(--cor-texto,#334155)] whitespace-nowrap max-md:text-[0.85rem] max-md:whitespace-normal max-md:text-center" style={{ color: "#991B1B" }}>Sem Profissional</h3>
              </div>
            </div>

            {agendamentosOrfaos.map((ag) => (
              <div
                key={ag.id}
                className="absolute left-1 right-1 bg-white border border-slate-200 rounded-lg py-2 px-3 flex flex-col border-l-4 border-l-[var(--cor-primaria)] !overflow-visible transition-[box-shadow] duration-200 ease-in z-[2] cursor-pointer hover:!h-max hover:min-h-fit hover:!z-[18] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2),0_8px_10px_-6px_rgba(0,0,0,0.1)] max-md:!py-1 max-md:!px-1.5"
                onClick={() => {
                  setAgendamentoEditando(ag);
                  setIsModalOpen(true);
                }}
                style={{
                  top: `${calcularPosicao(ag.horarioInicio)}px`,
                  height: `${ag.duracao * 2}px`,
                  backgroundColor: "#FFFFFF",
                  borderLeftColor: "#EF4444",
                  border: "2px dashed #FECACA",
                  borderLeft: "4px solid #EF4444",
                }}
              >
                <div className="!flex !flex-nowrap !justify-between !items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <span className="line-clamp-2 break-words leading-tight font-semibold text-[var(--cor-texto)] text-[0.95rem] max-md:text-[0.85rem]">{ag.cliente}</span>
                  </div>
                  <div
                    className="!flex !flex-nowrap items-center !mt-0 !justify-end flex-shrink-0"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAgendamentoParaExcluir(ag);
                      }}
                      className="flex w-[30px] h-[30px] bg-transparent rounded-lg items-center justify-center cursor-pointer border-none text-red-500 transition-all duration-200 hover:bg-slate-100 hover:text-red-700 max-md:w-7 max-md:h-7"
                      title="Excluir Definitivamente"
                    >
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-medium mb-auto mt-0.5 flex justify-between items-center">
                  <span>
                    {ag.horarioInicio} - {calcularHoraFim(ag.horarioInicio, ag.duracao)}
                  </span>
                  {ag.grupo_recorrencia && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAbrirRecorrencia(ag, e);
                      }}
                      style={{
                        backgroundColor: "#E0F2FE",
                        color: "#0284C7",
                        border: "none",
                        borderRadius: "6px",
                        width: "24px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        padding: 0,
                      }}
                      title="Ver série"
                    >
                      <RefreshCw size={14} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
                <div className="text-[0.82rem] text-slate-500 mt-auto pt-1 break-words leading-tight !line-clamp-2">
                  <span style={{ color: "#EF4444", fontWeight: "600", fontSize: "0.8rem" }}>Reatribuir profissional</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {mostrarLinhaTempo && (
          <div ref={linhaTempoRef} className="absolute left-0 right-0 h-[2px] bg-red-500 !z-25 pointer-events-none" style={{ top: `${posicaoLinhaTempo}px` }}>
            <div className="w-[10px] h-[10px] bg-red-500 rounded-full absolute -left-[5px] -top-[4px] !z-25 pointer-events-none"></div>
          </div>
        )}
      </div>
    </div>
  );
}
