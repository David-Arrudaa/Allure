import { MessageCircle, Save } from "lucide-react";
import Button from "../../components/ui/Button";
import "./Configuracoes.css";

export function Configuracoes() {
  return (
    <div className="configuracoes-container">
      <div className="configuracoes-topbar">
        <div className="configuracoes-info">
          <h2>Configurações do Sistema</h2>
          <p>Gerencie integrações e preferências da sua unidade</p>
        </div>
      </div>

      <div className="configuracoes-conteudo">
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

              <Button type="button" variant="primary">
                <Save size={18} />
                Salvar Configurações
              </Button>
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
              Nenhuma avaliação cadastrada ainda.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
