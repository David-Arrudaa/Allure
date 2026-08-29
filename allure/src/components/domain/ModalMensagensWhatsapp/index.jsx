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
        {/* CABEÇALHO */}
        <div className="modal-whatsapp-header">
          <h3 className="modal-whatsapp-titulo">
            {modo === "lista" && "Mensagens via WhatsApp"}
            {modo === "previa" && "Prévia da Mensagem"}
            {modo === "editor" &&
              (modeloEditando ? "Editar Modelo" : "Novo Modelo de Mensagem")}
          </h3>
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
            VISÃO 1: LISTA DE MENSAGENS (Fiel à imagem de referência)
            ======================================================== */}
        {modo === "lista" && (
          <>
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
                  <span className="item-modelo-titulo">{m.titulo}</span>
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
                  </div>
                </div>
              ))}

              {/* Opção de Escrever Mensagem Livre */}
              <div
                className="item-modelo-whatsapp item-escrever-livre"
                onClick={handleEscreverLivre}
              >
                <span className="item-modelo-titulo">
                  <MessageSquare size={16} />
                  Escrever Mensagem Livre
                </span>
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
          </>
        )}

        {/* ========================================================
            VISÃO 2: PRÉVIA E DISPARO DA MENSAGEM
            ======================================================== */}
        {modo === "previa" && (
          <div className="previa-container">
            <div className="cliente-destinatario-badge">
              <div className="cliente-destinatario-info">
                <Phone size={15} />
                <span>{agendamento.cliente || "Cliente"}</span>
              </div>
              <span>{agendamento.telefone || "Sem número cadastrado"}</span>
            </div>

            <textarea
              className="textarea-previa-whatsapp"
              value={textoPrevia}
              onChange={(e) => setTextoPrevia(e.target.value)}
              placeholder="Digite ou personalize sua mensagem..."
              rows={6}
            />

            <div className="previa-acoes">
              <button
                type="button"
                className="btn-voltar-whatsapp"
                onClick={() => setModo("lista")}
              >
                <ArrowLeft size={16} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                Voltar
              </button>

              <button
                type="button"
                className="btn-voltar-whatsapp"
                onClick={handleCopiarTexto}
                title="Copiar texto para colar"
                style={{ flex: "0.8" }}
              >
                {copiado ? (
                  <>
                    <Check size={16} color="#16A34A" style={{ verticalAlign: "middle", marginRight: "4px" }} />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={16} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                    Copiar
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-enviar-whatsapp"
                onClick={handleEnviarWhatsapp}
              >
                <Send size={16} />
                <span>Enviar</span>
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
                <Sparkles size={12} style={{ display: "inline", marginRight: "4px" }} />
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

