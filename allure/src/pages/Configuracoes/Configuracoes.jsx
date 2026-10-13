import { useState, useEffect } from "react";
import { MessageCircle, Save, CreditCard, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";
import { toast } from "../../lib/toast";
import "./Configuracoes.css";

export function Configuracoes() {
  const { profile, user } = useAuth();
  const tenantId = profile?.tenant_id || user?.tenant_id;

  const [loading, setLoading] = useState(true);
  const [salvandoTaxas, setSalvandoTaxas] = useState(false);

  // Estados de taxas de cartão
  const [descontarTaxa, setDescontarTaxa] = useState(false);
  const [taxaDebito, setTaxaDebito] = useState("1.99");
  const [taxaCredito, setTaxaCredito] = useState("3.99");

  useEffect(() => {
    async function carregarConfiguracoes() {
      if (!tenantId) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("tenants")
          .select("taxa_cartao_debito, taxa_cartao_credito, descontar_taxa_cartao_comissao")
          .eq("id", tenantId)
          .single();

        if (error) throw error;
        if (data) {
          setDescontarTaxa(Boolean(data.descontar_taxa_cartao_comissao));
          setTaxaDebito(data.taxa_cartao_debito !== null ? String(data.taxa_cartao_debito) : "1.99");
          setTaxaCredito(data.taxa_cartao_credito !== null ? String(data.taxa_cartao_credito) : "3.99");
        }
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      } finally {
        setLoading(false);
      }
    }
    carregarConfiguracoes();
  }, [tenantId]);

  const handleSalvarTaxas = async (e) => {
    e.preventDefault();
    if (!tenantId) return;

    try {
      setSalvandoTaxas(true);
      const { error } = await supabase
        .from("tenants")
        .update({
          descontar_taxa_cartao_comissao: descontarTaxa,
          taxa_cartao_debito: Number(taxaDebito) || 0,
          taxa_cartao_credito: Number(taxaCredito) || 0,
        })
        .eq("id", tenantId);

      if (error) throw error;
      toast.success("Taxas de cartão atualizadas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar taxas:", err);
      toast.error("Erro ao salvar taxas de cartão.");
    } finally {
      setSalvandoTaxas(false);
    }
  };

  return (
    <div className="configuracoes-container">
      <div className="configuracoes-topbar">
        <div className="configuracoes-info">
          <h2>Configurações do Sistema</h2>
          <p>Gerencie preferências, taxas e integrações da sua unidade</p>
        </div>
      </div>

      <div className="configuracoes-conteudo">
        {/* CARD TAXAS DE CARTÃO E COMISSÃO */}
        <div className="config-card">
          <div className="config-card-header">
            <CreditCard size={20} color="#7C3AED" />
            <h3>Taxas de Maquininha e Repasse de Comissão</h3>
          </div>
          <div className="config-card-body">
            {loading ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "#64748B" }}>
                Carregando configurações...
              </div>
            ) : (
              <form className="config-form" onSubmit={handleSalvarTaxas}>
                <div className="config-checkbox-group" style={{ marginBottom: "1rem" }}>
                  <input
                    id="descontar-taxa-comissao"
                    type="checkbox"
                    checked={descontarTaxa}
                    onChange={(e) => setDescontarTaxa(e.target.checked)}
                  />
                  <label htmlFor="descontar-taxa-comissao">
                    <strong>Descontar taxa da maquininha da comissão</strong>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "#64748B", marginTop: "2px" }}>
                      Se ativo, a comissão do profissional é calculada sobre o valor líquido recebido após o desconto da operadora.
                    </span>
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div className="config-form-group">
                    <label>Taxa Débito (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxaDebito}
                      onChange={(e) => setTaxaDebito(e.target.value)}
                      placeholder="Ex: 1.99"
                      required
                    />
                  </div>

                  <div className="config-form-group">
                    <label>Taxa Crédito à Vista (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxaCredito}
                      onChange={(e) => setTaxaCredito(e.target.value)}
                      placeholder="Ex: 3.99"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-salvar-config" disabled={salvandoTaxas}>
                  {salvandoTaxas ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {salvandoTaxas ? "Salvando..." : "Salvar Taxas de Cartão"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* CARD WHATSAPP INTEGRATION */}
        <div className="config-card">
          <div className="config-card-header">
            <MessageCircle size={20} color="#16A34A" />
            <h3>Integração WhatsApp (Evolution API)</h3>
          </div>
          <div className="config-card-body">
            <form className="config-form" onSubmit={(e) => e.preventDefault()}>
              <div className="config-form-group">
                <label>Instância ID</label>
                <input
                  type="text"
                  placeholder="Ex: luzz-salao-01"
                />
              </div>

              <div className="config-form-group">
                <label>API Key</label>
                <input
                  type="password"
                  placeholder="Sua chave de API da Evolution"
                />
              </div>

              <div className="config-checkbox-group">
                <input
                  id="auto-feedback"
                  name="auto-feedback"
                  type="checkbox"
                />
                <label htmlFor="auto-feedback">
                  Disparar lembrete e pesquisa de satisfação automaticamente ao concluir atendimento
                </label>
              </div>

              <button type="button" className="btn-salvar-config">
                <Save size={18} />
                Salvar Configurações
              </button>
            </form>
          </div>
        </div>

        <div className="config-card">
          <div className="config-card-header">
            <h3>Pesquisas de Satisfação</h3>
          </div>
          <div className="config-card-body">
            <div
              style={{
                textAlign: "center",
                padding: "2.5rem 1rem",
                backgroundColor: "#F8FAFC",
                borderRadius: "8px",
                border: "1px dashed #CBD5E1",
                color: "#64748B",
                fontSize: "0.9rem",
              }}
            >
              Nenhuma avaliação de cliente recebida ainda.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
