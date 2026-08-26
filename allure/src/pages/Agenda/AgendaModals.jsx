import { X, CalendarDays, Trash2 } from "lucide-react";
import { ModalAgendamento } from "../../components/domain/ModalAgendamento";
import { ModalPagamento } from "../../components/domain/ModalPagamento/ModalPagamento";
import { ModalWhatsApp } from "../../components/domain/ModalWhatsApp";
import { formatarDataInput } from "./utils";
import { supabase } from "../../services/supabase";

export function AgendaModals({
  // ModalAgendamento
  isModalOpen,
  setIsModalOpen,
  agendamentoEditando,
  carregarDadosAgenda,
  mostrarNotificacao,

  // ModalPagamento
  isModalPagamentoAberto,
  setIsModalPagamentoAberto,
  agendamentoParaPagamento,

  // ModalWhatsApp
  isModalWhatsAppAberto,
  setIsModalWhatsAppAberto,
  agendamentoParaWhatsApp,

  // Modals Inline
  isModalRecorrenciaAberto,
  setIsModalRecorrenciaAberto,
  loadingRecorrencia,
  listaRecorrencia,
  grupoRecorrenciaFoco,
  setAgendamentoEditando,
  setItemRecorrenciaParaExcluir,
  setModalExclusaoSerieAberto,
  
  modalExclusaoSerieAberto,
  setModalExclusaoSerieAbertoState, // mapped correctly
  executarExclusaoSerie,

  itemRecorrenciaParaExcluir,
  setItemRecorrenciaParaExcluirState,
  executarExclusaoItemUnico,

  agendamentoParaDesfazerPagamento,
  setAgendamentoParaDesfazerPagamento,

  agendamentoParaExcluir,
  setAgendamentoParaExcluir,
  confirmarExclusao
}) {
  return (
    <>
      <ModalAgendamento
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        agendamento={agendamentoEditando}
        onSave={() => {
          setIsModalOpen(false);
          carregarDadosAgenda();
          mostrarNotificacao(
            agendamentoEditando ? "Agendamento atualizado!" : "Agendamento salvo com sucesso!"
          );
        }}
      />

      <ModalPagamento
        isOpen={isModalPagamentoAberto}
        onClose={() => setIsModalPagamentoAberto(false)}
        dados={agendamentoParaPagamento}
        onSave={async (pacotePagamento) => {
          if (agendamentoParaPagamento) {
            await supabase
              .from("appointments")
              .update({
                pagamento: "pago",
                status: "confirmado",
                forma_pagamento: pacotePagamento.metodoPagamento,
              })
              .eq("id", agendamentoParaPagamento.id);
            carregarDadosAgenda();
            mostrarNotificacao("Pagamento recebido com sucesso!");
          }
          setIsModalPagamentoAberto(false);
        }}
      />

      <ModalWhatsApp
        isOpen={isModalWhatsAppAberto}
        onClose={() => setIsModalWhatsAppAberto(false)}
        agendamento={agendamentoParaWhatsApp}
      />

      {isModalRecorrenciaAberto && (
        <div className="modal-overlay" onClick={() => setIsModalRecorrenciaAberto(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "550px" }}>
            <div className="modal-header" style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ padding: "8px", backgroundColor: "#E0F2FE", borderRadius: "8px", color: "#0284C7" }}>
                  <CalendarDays size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#1E293B" }}>Série de Agendamentos</h2>
                  <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#64748B" }}>
                    Visualizando horários futuros de <strong>{grupoRecorrenciaFoco?.cliente}</strong>.
                  </p>
                </div>
              </div>
              <button className="btn-fechar" onClick={() => setIsModalRecorrenciaAberto(false)}>
                <X size={20} />
              </button>
            </div>

            {loadingRecorrencia ? (
              <p style={{ textAlign: "center", color: "#64748B", padding: "2rem" }}>Carregando horários...</p>
            ) : (
              <div style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {listaRecorrencia.map((item) => {
                  const dataObj = new Date(item.data_horario);
                  const dataFormatada = `${String(dataObj.getDate()).padStart(2, "0")}/${String(dataObj.getMonth() + 1).padStart(2, "0")}`;
                  const horaFormatada = dataObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

                  return (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "1px solid #E2E8F0", borderRadius: "8px", backgroundColor: "#F8FAFC" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: "6px", padding: "4px 8px", fontWeight: "700", color: "#334155" }}>
                          {dataFormatada}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", color: "#0F172A", fontSize: "0.95rem" }}>{horaFormatada}</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748B" }}>{item.status}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => {
                            setAgendamentoEditando({
                              id: item.id,
                              cliente: item.customers?.nome,
                              profissionalId: item.profissional_id,
                              servico: item.servico,
                              horarioInicio: horaFormatada,
                              data: formatarDataInput(dataObj),
                              duracao: 60,
                              valor: String(item.valor).replace(".", ","),
                              status: item.status,
                              grupo_recorrencia: item.grupo_recorrencia,
                            });
                            setIsModalRecorrenciaAberto(false);
                            setIsModalOpen(true);
                          }}
                          style={{ padding: "6px 12px", backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "6px", color: "#475569", fontWeight: "600", cursor: "pointer" }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setItemRecorrenciaParaExcluir(item)}
                          style={{ padding: "6px", backgroundColor: "#FEE2E2", border: "none", borderRadius: "6px", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                          title="Excluir apenas este"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #E2E8F0" }}>
              <button
                onClick={() => setModalExclusaoSerieAberto(true)}
                style={{ width: "100%", padding: "10px", backgroundColor: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA", borderRadius: "8px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
              >
                Excluir Todos os Futuros Desta Série
              </button>
            </div>
          </div>
        </div>
      )}

      {modalExclusaoSerieAberto && (
        <div className="modal-overlay" onClick={() => setModalExclusaoSerieAbertoState(false)} style={{ zIndex: 1200 }}>
          <div className="modal-box !max-w-[350px] !p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-slate-700 mb-2 text-xl font-bold">Excluir Série</h3>
            <p className="text-slate-500 text-[0.95rem] mb-6">Isso irá apagar todos os horários futuros de <strong>{grupoRecorrenciaFoco?.cliente}</strong>.<br />Tem certeza?</p>
            <div className="flex justify-center gap-4">
              <button className="bg-slate-100 text-slate-500 border-none py-2.5 px-5 rounded-lg font-semibold cursor-pointer transition-colors duration-200 hover:bg-slate-200" onClick={() => setModalExclusaoSerieAbertoState(false)}>Cancelar</button>
              <button className="bg-red-500 text-white border-none py-2.5 px-5 rounded-lg font-semibold cursor-pointer transition-colors duration-200 hover:bg-red-600" onClick={executarExclusaoSerie}>Sim, apagar</button>
            </div>
          </div>
        </div>
      )}

      {itemRecorrenciaParaExcluir && (
        <div className="modal-overlay" onClick={() => setItemRecorrenciaParaExcluirState(null)} style={{ zIndex: 1200 }}>
          <div className="modal-box !max-w-[350px] !p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-slate-700 mb-2 text-xl font-bold">Confirmar Exclusão</h3>
            <p className="text-slate-500 text-[0.95rem] mb-6">Deseja apagar apenas este horário da série?</p>
            <div className="flex justify-center gap-4">
              <button className="bg-slate-100 text-slate-500 border-none py-2.5 px-5 rounded-lg font-semibold cursor-pointer transition-colors duration-200 hover:bg-slate-200" onClick={() => setItemRecorrenciaParaExcluirState(null)}>Cancelar</button>
              <button className="bg-red-500 text-white border-none py-2.5 px-5 rounded-lg font-semibold cursor-pointer transition-colors duration-200 hover:bg-red-600" onClick={executarExclusaoItemUnico}>Sim, apagar</button>
            </div>
          </div>
        </div>
      )}

      {agendamentoParaDesfazerPagamento && (
        <div className="modal-overlay" onClick={() => setAgendamentoParaDesfazerPagamento(null)}>
          <div className="modal-box !max-w-[350px] !p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-slate-700 mb-2 text-xl font-bold">Desfazer Pagamento</h3>
            <p className="text-slate-500 text-[0.95rem] mb-6">Deseja estornar o pagamento recebido de <strong>{agendamentoParaDesfazerPagamento.cliente}</strong>?</p>
            <div className="flex justify-center gap-4">
              <button className="bg-slate-100 text-slate-500 border-none py-2.5 px-5 rounded-lg font-semibold cursor-pointer transition-colors duration-200 hover:bg-slate-200" onClick={() => setAgendamentoParaDesfazerPagamento(null)}>Voltar</button>
              <button
                className="bg-red-500 text-white border-none py-2.5 px-5 rounded-lg font-semibold cursor-pointer transition-colors duration-200 hover:bg-red-600"
                onClick={async () => {
                  await supabase
                    .from("appointments")
                    .update({ pagamento: "pendente", forma_pagamento: null })
                    .eq("id", agendamentoParaDesfazerPagamento.id);
                  setAgendamentoParaDesfazerPagamento(null);
                  carregarDadosAgenda();
                  mostrarNotificacao("Pagamento desfeito.");
                }}
              >
                Sim, desfazer
              </button>
            </div>
          </div>
        </div>
      )}

      {agendamentoParaExcluir && (
        <div className="modal-overlay" onClick={() => setAgendamentoParaExcluir(null)}>
          <div className="modal-box !max-w-[350px] !p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-slate-700 mb-2 text-xl font-bold">Confirmar Exclusão</h3>
            <p className="text-slate-500 text-[0.95rem] mb-6">Tem certeza que deseja apagar o agendamento de <strong>{agendamentoParaExcluir.cliente}</strong>?</p>
            <div className="flex justify-center gap-4">
              <button className="bg-slate-100 text-slate-500 border-none py-2.5 px-5 rounded-lg font-semibold cursor-pointer transition-colors duration-200 hover:bg-slate-200" onClick={() => setAgendamentoParaExcluir(null)}>Cancelar</button>
              <button className="bg-red-500 text-white border-none py-2.5 px-5 rounded-lg font-semibold cursor-pointer transition-colors duration-200 hover:bg-red-600" onClick={confirmarExclusao}>Sim, apagar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
