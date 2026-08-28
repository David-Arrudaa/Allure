import { useState, useEffect } from "react";
import {
  X,
  Edit2,
  Trash2,
  Plus,
  Send,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Phone,
  Copy,
  Check,
  ChevronRight,
  User,
} from "lucide-react";
import "./ModalMensagensWhatsapp.css";

const MODELOS_PADRAO = [
  {
    id: "conf-agendamento",
    titulo: "Confirmação de agendamento",
    texto:
      "Olá {cliente}, tudo bem? Confirmando seu agendamento de {servico} para o dia {data} às {horario} com {profissional}. Podemos confirmar sua presença?",
  },
  {
    id: "lembrete-horario",
    titulo: "Lembrete de horário",
    texto:
      "Olá {cliente}! Passando para lembrar do seu agendamento de {servico} hoje às {horario} com {profissional}. Te aguardamos!",
  },
  {
    id: "msg-aniversario",
    titulo: "Mensagem de aniversário",
    texto:
      "Parabéns pelo seu dia, {cliente}! 🎂🎉 Desejamos muitas felicidades e preparamos um carinho especial para você aqui no salão. Esperamos você em breve!",
  },
  {
    id: "enviar-avaliacao",
    titulo: "Enviar avaliação",
    texto:
      "Olá {cliente}! Foi um prazer atender você hoje. Como foi sua experiência no salão? Sua opinião é muito importante para nós! 💖",
  },
  {
    id: "aviso-cobranca",
    titulo: "Aviso de pagamento / PIX",
    texto:
      "Olá {cliente}, segue o resumo do seu agendamento de {servico}: Valor total R$ {valor}. Qualquer dúvida estamos à disposição!",
  },
];

export function ModalMensagensWhatsapp({ isOpen, onClose, agendamento }) {
  const [modelos, setModelos] = useState(() => {
    try {
      const salvos = localStorage.getItem("luzz_whatsapp_templates");
      return salvos ? JSON.parse(salvos) : MODELOS_PADRAO;
    } catch {
      return MODELOS_PADRAO;
    }
  });

  // Modos de visualização: 'lista' | 'previa' | 'editor'
  const [modo, setModo] = useState("lista");

  // Estado da prévia de envio
  const [textoPrevia, setTextoPrevia] = useState("");
  const [copiado, setCopiado] = useState(false);

  // Estado do editor de modelo
  const [modeloEditando, setModeloEditando] = useState(null); // null = criando novo
  const [tituloForm, setTituloForm] = useState("");
  const [textoForm, setTextoForm] = useState("");

  // Persistir modelos no localStorage
  useEffect(() => {
    try {
      localStorage.setItem("luzz_whatsapp_templates", JSON.stringify(modelos));
    } catch (e) {
      console.error("Erro ao salvar modelos de WhatsApp:", e);
    }
  }, [modelos]);

  // Resetar ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      setModo("lista");
      setCopiado(false);
    }
  }, [isOpen, agendamento]);

  if (!isOpen || !agendamento) return null;

  // Substituir variáveis dinâmicas
  const processarTexto = (template) => {
    if (!template) return "";

    const nomeCompleto = agendamento.cliente || "Cliente";
    const primeiroNome = nomeCompleto.split(" ")[0];
    const servico = agendamento.servico || "Atendimento";
    const dataFormatada = agendamento.data_horario
      ? new Date(agendamento.data_horario).toLocaleDateString("pt-BR")
      : "hoje";
    const horario = agendamento.horarioInicio || "";
    const profissional = agendamento.profissionalNome || "sua profissional";
    const valor = agendamento.valor
      ? Number(agendamento.valor).toFixed(2).replace(".", ",")
      : "0,00";

    return template
      .replace(/\{cliente\}/gi, nomeCompleto)
      .replace(/\{primeiro_nome\}/gi, primeiroNome)
      .replace(/\{servico\}/gi, servico)
      .replace(/\{data\}/gi, dataFormatada)
      .replace(/\{horario\}/gi, horario)
      .replace(/\{profissional\}/gi, profissional)
      .replace(/\{valor\}/gi, valor)
      .replace(/\{salao\}/gi, "nosso salão");
  };

  // Obter hora atual formatada para a bolha do chat
  const horaAtual = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Abrir prévia de um modelo
  const handleSelecionarModelo = (modelo) => {
    const textoPronto = processarTexto(modelo.texto);
    setTextoPrevia(textoPronto);
    setModo("previa");
  };

  // Abrir modo "Escrever Mensagem Livre"
  const handleEscreverLivre = () => {
    const saudacao = `Olá ${agendamento.cliente || ""}, `;
    setTextoPrevia(saudacao);
    setModo("previa");
  };

  // Disparar envio no WhatsApp
  const handleEnviarWhatsapp = () => {
    const telefoneLimpo = agendamento.telefone
      ? agendamento.telefone.replace(/\D/g, "")
      : "";
    const mensagemCodificada = encodeURIComponent(textoPrevia);

    let url = "";
    if (telefoneLimpo) {
      const numeroFinal =
        telefoneLimpo.startsWith("55")
          ? telefoneLimpo
          : `55${telefoneLimpo}`;
      url = `https://wa.me/${numeroFinal}?text=${mensagemCodificada}`;
    } else {
      url = `https://wa.me/?text=${mensagemCodificada}`;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  // Copiar texto para área de transferência
  const handleCopiarTexto = () => {
    navigator.clipboard.writeText(textoPrevia);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Abrir editor para novo modelo
  const handleNovoModelo = (e) => {
    e.stopPropagation();
    setModeloEditando(null);
    setTituloForm("");
    setTextoForm("");
    setModo("editor");
  };

  // Abrir editor para editar modelo existente
  const handleEditarModelo = (modelo, e) => {
    e.stopPropagation();
    setModeloEditando(modelo);
    setTituloForm(modelo.titulo);
    setTextoForm(modelo.texto);
    setModo("editor");
  };

  // Excluir modelo
  const handleExcluirModelo = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Deseja realmente excluir este modelo de mensagem?")) {
      setModelos((prev) => prev.filter((m) => m.id !== id));
    }
  };

  // Salvar modelo criado ou editado
  const handleSalvarModelo = (e) => {
    e.preventDefault();
    if (!tituloForm.trim() || !textoForm.trim()) return;

    if (modeloEditando) {
      setModelos((prev) =>
        prev.map((m) =>
          m.id === modeloEditando.id
            ? { ...m, titulo: tituloForm.trim(), texto: textoForm.trim() }
            : m,
        ),
      );
    } else {
      const novo = {
        id: `modelo-${Date.now()}`,
        titulo: tituloForm.trim(),
        texto: textoForm.trim(),
      };
      setModelos((prev) => [...prev, novo]);
    }

    setModo("lista");
  };

  // Inserir tag de variável no editor
  const handleInserirTag = (tag) => {
    setTextoForm((prev) => prev + ` ${tag} `);
  };

  return (
    <div className="modal-whatsapp-overlay" onClick={onClose}>
      <div
        className="modal-whatsapp-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO COM IDENTIFICAÇÃO DA CLIENTE */}
        <div className="modal-whatsapp-header">
          <div className="modal-whatsapp-header-info">
            <div className="modal-whatsapp-icon-badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <div>
              <h3 className="modal-whatsapp-titulo">
                {modo === "lista" && "Mensagens via WhatsApp"}
                {modo === "previa" && "Prévia da Mensagem"}
                {modo === "editor" &&
                  (modeloEditando ? "Editar Modelo" : "Novo Modelo de Mensagem")}
              </h3>
              <p className="modal-whatsapp-destinatario">
                Para: <strong>{agendamento.cliente || "Cliente"}</strong>
                {agendamento.telefone && (
                  <span className="destinatario-telefone"> • {agendamento.telefone}</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-fechar-whatsapp"
            onClick={onClose}
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ========================================================
            VISÃO 1: LISTA DE MENSAGENS (Fiel à referência com melhorias UI/UX)
            ======================================================== */}
        {modo === "lista" && (
          <div className="whatsapp-tab-content">
            <p className="modal-whatsapp-subtitulo">
              Selecione a mensagem para envio:
            </p>

            <div className="lista-modelos-whatsapp">
              {modelos.map((m) => (
                <div
                  key={m.id}
                  className="item-modelo-whatsapp"
                  onClick={() => handleSelecionarModelo(m)}
                  title="Clique para enviar esta mensagem"
                >
                  <div className="item-modelo-conteudo">
                    <span className="item-modelo-titulo">{m.titulo}</span>
                    <span className="item-modelo-preview">
                      {m.texto.slice(0, 60)}...
                    </span>
                  </div>

                  <div
                    className="item-modelo-acoes"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="btn-acao-modelo editar"
                      onClick={(e) => handleEditarModelo(m, e)}
                      title="Editar este modelo"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-acao-modelo excluir"
                      onClick={(e) => handleExcluirModelo(m.id, e)}
                      title="Excluir este modelo"
                    >
                      <Trash2 size={15} />
                    </button>
                    <ChevronRight size={16} className="item-seta-indicador" />
                  </div>
                </div>
              ))}

              {/* Opção de Escrever Mensagem Livre */}
              <div
                className="item-modelo-whatsapp item-escrever-livre"
                onClick={handleEscreverLivre}
              >
                <div className="item-modelo-conteudo">
                  <span className="item-modelo-titulo">
                    <MessageSquare size={16} />
                    Escrever Mensagem Livre
                  </span>
                  <span className="item-modelo-preview">
                    Digite um texto personalizado agora
                  </span>
                </div>
                <ChevronRight size={16} className="item-seta-indicador" />
              </div>
            </div>

            <button
              type="button"
              className="btn-criar-novo-modelo"
              onClick={handleNovoModelo}
            >
              <Plus size={16} />
              <span>Criar Novo Modelo</span>
            </button>
          </div>
        )}

        {/* ========================================================
            VISÃO 2: PRÉVIA INTERATIVA (Estilo Bolha do WhatsApp)
            ======================================================== */}
        {modo === "previa" && (
          <div className="previa-container">
            <div className="whatsapp-chat-preview-box">
              <div className="whatsapp-chat-header">
                <div className="whatsapp-avatar-small">
                  <User size={14} />
                </div>
                <div className="whatsapp-contact-info">
                  <span className="whatsapp-contact-name">
                    {agendamento.cliente || "Cliente"}
                  </span>
                  <span className="whatsapp-contact-status">online</span>
                </div>
              </div>

              <div className="whatsapp-chat-bubble">
                <textarea
                  className="textarea-bubble-whatsapp"
                  value={textoPrevia}
                  onChange={(e) => setTextoPrevia(e.target.value)}
                  placeholder="Digite ou personalize sua mensagem..."
                  rows={5}
                />
                <div className="whatsapp-bubble-footer">
                  <span className="whatsapp-bubble-time">{horaAtual}</span>
                  <span className="whatsapp-bubble-checks">✓✓</span>
                </div>
              </div>
            </div>

            <p className="dica-edicao-previa">
              💡 Você pode editar o texto acima antes de enviar.
            </p>

            <div className="previa-acoes">
              <button
                type="button"
                className="btn-voltar-whatsapp"
                onClick={() => setModo("lista")}
              >
                <ArrowLeft size={16} />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                className="btn-copiar-whatsapp"
                onClick={handleCopiarTexto}
                title="Copiar texto para colar"
              >
                {copiado ? (
                  <>
                    <Check size={16} color="#16A34A" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copiar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-enviar-whatsapp"
                onClick={handleEnviarWhatsapp}
              >
                <Send size={16} />
                <span>Enviar no WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            VISÃO 3: CRIAR / EDITAR MODELO DE MENSAGEM
            ======================================================== */}
        {modo === "editor" && (
          <form className="editor-modelo-form" onSubmit={handleSalvarModelo}>
            <div className="editor-campo">
              <label htmlFor="tituloModelo">Nome do Modelo</label>
              <input
                id="tituloModelo"
                type="text"
                value={tituloForm}
                onChange={(e) => setTituloForm(e.target.value)}
                required
                placeholder="Ex: Confirmação de Retorno 15 dias"
              />
            </div>

            <div className="tags-variaveis-container">
              <span className="tags-variaveis-titulo">
                <Sparkles size={12} />
                Clique para inserir variáveis automáticas:
              </span>
              <div className="chips-variaveis">
                <button
                  type="button"
                  className="chip-tag"
                  onClick={() => handleInserirTag("{cliente}")}
                >
                  + {"{cliente}"}
                </button>
                <button
                  type="button"
                  className="chip-tag"
                  onClick={() => handleInserirTag("{servico}")}
                >
                  + {"{servico}"}
                </button>
                <button
                  type="button"
                  className="chip-tag"
                  onClick={() => handleInserirTag("{horario}")}
                >
                  + {"{horario}"}
                </button>
                <button
                  type="button"
                  className="chip-tag"
                  onClick={() => handleInserirTag("{data}")}
                >
                  + {"{data}"}
                </button>
                <button
                  type="button"
                  className="chip-tag"
                  onClick={() => handleInserirTag("{profissional}")}
                >
                  + {"{profissional}"}
                </button>
                <button
                  type="button"
                  className="chip-tag"
                  onClick={() => handleInserirTag("{valor}")}
                >
                  + {"{valor}"}
                </button>
              </div>
            </div>

            <div className="editor-campo">
              <label htmlFor="textoModelo">Texto da Mensagem</label>
              <textarea
                id="textoModelo"
                value={textoForm}
                onChange={(e) => setTextoForm(e.target.value)}
                required
                rows={5}
                placeholder="Ex: Olá {cliente}, passando para confirmar seu horário de {servico} às {horario}..."
              />
            </div>

            <div className="editor-acoes">
              <button
                type="button"
                className="btn-voltar-whatsapp"
                onClick={() => setModo("lista")}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-salvar-modelo">
                Salvar Modelo
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
