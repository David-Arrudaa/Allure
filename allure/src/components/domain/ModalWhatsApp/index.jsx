import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../../services/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { Modal } from "../../ui/Modal";
import Button from "../../ui/Button";
import { FORM_STYLES } from "../../../config/theme";

export function ModalWhatsApp({ isOpen, onClose, agendamento }) {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [templateEmEdicao, setTemplateEmEdicao] = useState(null);

  const [assunto, setAssunto] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      carregarTemplates();
      setIsEditing(false);
      setTemplateEmEdicao(null);
      setAssunto("");
      setConteudo("");
    }
  }, [isOpen]);

  const carregarTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("whatsapp_templates")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!assunto.trim() || !conteudo.trim()) return;

    try {
      setSalvando(true);

      if (templateEmEdicao) {
        const { error } = await supabase
          .from("whatsapp_templates")
          .update({ assunto, conteudo })
          .eq("id", templateEmEdicao.id);
        if (error) throw error;
        toast.success("Mensagem atualizada!");
      } else {
        const { error } = await supabase
          .from("whatsapp_templates")
          .insert([{ assunto, conteudo, tenant_id: profile?.tenant_id }]);
        if (error) throw error;
        toast.success("Mensagem cadastrada!");
      }

      await carregarTemplates();
      setIsEditing(false);
      setTemplateEmEdicao(null);
      setAssunto("");
      setConteudo("");
    } catch (error) {
      console.error("Erro ao salvar template:", error);
      toast.error("Erro ao salvar a mensagem.");
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = (template) => {
    setTemplateEmEdicao(template);
    setAssunto(template.assunto);
    setConteudo(template.conteudo);
    setIsEditing(true);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta mensagem?")) return;
    try {
      const { error } = await supabase
        .from("whatsapp_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Mensagem excluída.");
      await carregarTemplates();
    } catch (error) {
      console.error("Erro ao excluir template:", error);
      toast.error("Erro ao excluir mensagem.");
    }
  };

  const enviarWhatsapp = (template) => {
    if (!agendamento) return;

    const telefoneLimpo = agendamento.telefone ? agendamento.telefone.replace(/\D/g, "") : "";

    let textoFinal = template.conteudo
      .replace(/{{cliente}}/g, agendamento.cliente)
      .replace(/{{servico}}/g, agendamento.servico)
      .replace(/{{horario}}/g, agendamento.horarioInicio)
      .replace(/{{data}}/g, agendamento.data)
      .replace(/{{valor}}/g, agendamento.valor);

    const mensagem = encodeURIComponent(textoFinal);
    const link = telefoneLimpo
      ? `https://wa.me/55${telefoneLimpo}?text=${mensagem}`
      : `https://wa.me/?text=${mensagem}`;

    window.open(link, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mensagens Rápidas (WhatsApp)">
      <div className="space-y-5">
        {isEditing ? (
          <form onSubmit={handleSalvar} className="space-y-5">
            <div className={FORM_STYLES.group}>
              <label className={FORM_STYLES.label}>Assunto (Título da Mensagem)</label>
              <input
                type="text"
                placeholder="Ex: Lembrete de Agendamento"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                required
                autoComplete="off"
                className={FORM_STYLES.input}
              />
            </div>
            <div className={FORM_STYLES.group}>
              <label className={FORM_STYLES.label}>Conteúdo da Mensagem</label>
              <textarea
                placeholder="Olá {{cliente}}, seu agendamento de {{servico}} é as {{horario}}."
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                rows={5}
                required
                className={FORM_STYLES.textarea}
              />
              <small className="text-xs text-slate-500">
                Variáveis disponíveis: {"{{cliente}}"}, {"{{servico}}"}, {"{{horario}}"}, {"{{data}}"}, {"{{valor}}"}
              </small>
            </div>
            <div className={FORM_STYLES.actions}>
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar Mensagem"}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {loading ? (
                <div className="flex justify-center p-8 text-slate-500">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : templates.length > 0 ? (
                templates.map((template) => (
                  <div key={template.id} className="p-3.5 border border-slate-200/80 rounded-2xl bg-slate-50/50 hover:bg-slate-100/80 transition-colors flex justify-between items-center gap-3">
                    <div className="flex-1 cursor-pointer" onClick={() => enviarWhatsapp(template)}>
                      <h4 className="text-sm font-bold text-slate-800">{template.assunto}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{template.conteudo}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => enviarWhatsapp(template)} title="Enviar Mensagem">
                        <Send size={16} className="text-emerald-600" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleEditar(template)} title="Editar">
                        <Edit2 size={16} className="text-slate-600" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleExcluir(template.id)} title="Excluir">
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-8 text-sm">
                  Nenhuma mensagem rápida cadastrada.
                </p>
              )}
            </div>

            <div className={FORM_STYLES.actions}>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  setTemplateEmEdicao(null);
                  setAssunto("");
                  setConteudo("");
                  setIsEditing(true);
                }}
              >
                <Plus size={18} /> Nova Mensagem
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
