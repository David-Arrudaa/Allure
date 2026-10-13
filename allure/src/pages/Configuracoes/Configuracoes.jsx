import { useState, useEffect } from "react";
import { MessageCircle, Save, CreditCard, Loader2, Send } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";
import {
  fetchConfigWhatsapp,
  salvarConfigWhatsapp,
  enviarMensagemEvolution,
} from "../../services/whatsappService";
import { toast } from "../../lib/toast";
import "./Configuracoes.css";

export function Configuracoes() {
  const { profile, user } = useAuth();
  const tenantId = profile?.tenant_id || user?.tenant_id;

  const [loading, setLoading] = useState(true);
  const [salvandoTaxas, setSalvandoTaxas] = useState(false);
  const [salvandoWhatsapp, setSalvandoWhatsapp] = useState(false);
  const [enviandoTeste, setEnviandoTeste] = useState(false);

  // Estados de taxas de cartão
  const [descontarTaxa, setDescontarTaxa] = useState(false);
  const [taxaDebito, setTaxaDebito] = useState("1.99");
  const [taxaCredito, setTaxaCredito] = useState("3.99");

  // Estados de WhatsApp (Evolution API)
  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [ativoWhatsapp, setAtivoWhatsapp] = useState(false);
  const [mensagemLembrete, setMensagemLembrete] = useState(
    "Olá {cliente}, seu agendamento de {servico} com {profissional} está confirmado para {data} às {horario}. Te esperamos!"
  );
  const [telefoneTeste, setTelefoneTeste] = useState("");

  useEffect(() => {
    async function carregarConfiguracoes() {
      if (!tenantId) return;
      try {
        setLoading(true);
        const [resTenant, resWhats] = await Promise.all([
          supabase
            .from("tenants")
            .select("taxa_cartao_debito, taxa_cartao_credito, descontar_taxa_cartao_comissao")
            .eq("id", tenantId)
            .single(),
          fetchConfigWhatsapp(tenantId),
        ]);

        if (resTenant.data) {
          setDescontarTaxa(Boolean(resTenant.data.descontar_taxa_cartao_comissao));
          setTaxaDebito(
            resTenant.data.taxa_cartao_debito !== null ? String(resTenant.data.taxa_cartao_debito) : "1.99"
          );
          setTaxaCredito(
            resTenant.data.taxa_cartao_credito !== null ? String(resTenant.data.taxa_cartao_credito) : "3.99"
          );
        }

        if (resWhats) {
          setApiUrl(resWhats.api_url || "");
          setApiToken(resWhats.api_token || "");
          setAtivoWhatsapp(Boolean(resWhats.ativo));
          if (resWhats.mensagem_lembrete) {
            setMensagemLembrete(resWhats.mensagem_lembrete);
          }
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

  const handleSalvarWhatsapp = async (e) => {
    e.preventDefault();
    if (!tenantId) return;

    try {
      setSalvandoWhatsapp(true);
      await salvarConfigWhatsapp(tenantId, {
        apiUrl,
        apiToken,
        ativo: ativoWhatsapp,
        mensagemLembrete,
      });

      toast.success("Configuração de WhatsApp salva com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar whatsapp:", err);
      toast.error("Erro ao salvar integração com WhatsApp.");
    } finally {
      setSalvandoWhatsapp(false);
    }
  };

  const handleTestarEnvio = async () => {
    if (!apiUrl.trim() || !apiToken.trim() || !telefoneTeste.trim()) {
      toast.error("Informe a URL da API, a chave e o número para teste.");
      return;
    }

    try {
      setEnviandoTeste(true);
      await enviarMensagemEvolution({
        apiUrl,
        apiToken,
        numero: telefoneTeste,
        texto: "Teste de envio LUZZ: sua integração com a Evolution API está funcionando perfeitamente!",
      });

      toast.success("Mensagem de teste enviada com sucesso no WhatsApp!");
    } catch (err) {
      console.error("Erro no envio de teste:", err);
      toast.error(`Falha no envio: ${err.message}`);
    } finally {
      setEnviandoTeste(false);
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
            <h3>Lembretes Automáticos via WhatsApp (Evolution API)</h3>
          </div>
          <div className="config-card-body">
            <form className="config-form" onSubmit={handleSalvarWhatsapp}>
              <div className="config-checkbox-group" style={{ marginBottom: "1rem" }}>
                <input
                  id="ativo-whatsapp"
                  type="checkbox"
                  checked={ativoWhatsapp}
                  onChange={(e) => setAtivoWhatsapp(e.target.checked)}
                />
                <label htmlFor="ativo-whatsapp">
                  <strong>Ativar disparos automáticos de WhatsApp</strong>
                  <span style={{ display: "block", fontSize: "0.8rem", color: "#64748B", marginTop: "2px" }}>
                    Envia lembretes para os clientes automaticamente ao agendar e confirmar horários.
                  </span>
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="config-form-group">
                  <label>URL da Evolution API com Instância *</label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://api.seudominio.com/message/sendText/sua-instancia"
                  />
                  <span style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
                    Ex: https://evolution.app.br ou com /message/sendText/instancia
                  </span>
                </div>

                <div className="config-form-group">
                  <label>API Key / Global Token *</label>
                  <input
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Sua chave apikey da Evolution"
                  />
                </div>
              </div>

              <div className="config-form-group" style={{ marginTop: "1rem" }}>
                <label>Template da Mensagem de Lembrete</label>
                <textarea
                  rows={3}
                  value={mensagemLembrete}
                  onChange={(e) => setMensagemLembrete(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                  placeholder="Olá {cliente}, seu agendamento de {servico} com {profissional} está marcado..."
                />
                <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: "4px" }}>
                  Tags disponíveis: <code>{"{cliente}"}</code>, <code>{"{servico}"}</code>, <code>{"{profissional}"}</code>, <code>{"{data}"}</code>, <code>{"{horario}"}</code>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "1.2rem", flexWrap: "wrap" }}>
                <button type="submit" className="btn-salvar-config" disabled={salvandoWhatsapp}>
                  {salvandoWhatsapp ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {salvandoWhatsapp ? "Salvando..." : "Salvar Configurações de WhatsApp"}
                </button>
              </div>

              {/* TESTE DE ENVIO */}
              <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px dashed #E2E8F0" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                  Testar Conexão com WhatsApp
                </div>
                <div style={{ display: "flex", gap: "8px", maxWidth: "450px" }}>
                  <input
                    type="text"
                    value={telefoneTeste}
                    onChange={(e) => setTelefoneTeste(e.target.value)}
                    placeholder="Seu celular: (11) 99999-9999"
                    style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "0.85rem" }}
                  />
                  <button
                    type="button"
                    onClick={handleTestarEnvio}
                    disabled={enviandoTeste || !apiUrl || !apiToken}
                    style={{
                      padding: "8px 14px",
                      background: "#16A34A",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      opacity: !apiUrl || !apiToken ? 0.6 : 1,
                    }}
                  >
                    {enviandoTeste ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {enviandoTeste ? "Enviando..." : "Enviar Teste"}
                  </button>
                </div>
              </div>
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
