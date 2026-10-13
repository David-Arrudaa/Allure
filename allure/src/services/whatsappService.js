import { supabase } from "./supabase";

/**
 * Busca a configuração da Evolution API para o tenant.
 */
export async function fetchConfigWhatsapp(tenantId) {
  if (!tenantId) return null;
  const { data, error } = await supabase
    .from("integracoes_whatsapp")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar integracao whatsapp:", error);
    return null;
  }

  return data;
}

/**
 * Salva ou atualiza as configurações da Evolution API.
 */
export async function salvarConfigWhatsapp(tenantId, config) {
  if (!tenantId) throw new Error("tenantId é obrigatório");

  const payload = {
    tenant_id: tenantId,
    api_url: config.apiUrl?.trim() || "",
    api_token: config.apiToken?.trim() || "",
    ativo: Boolean(config.ativo),
    mensagem_lembrete:
      config.mensagemLembrete?.trim() ||
      "Olá {cliente}, seu agendamento de {servico} com {profissional} está confirmado para {data} às {horario}. Te esperamos!",
    mensagem_pesquisa:
      config.mensagemPesquisa?.trim() ||
      "Olá {cliente}, como foi seu atendimento com {profissional}? Adoraríamos saber sua opinião!",
  };

  const { data: existente } = await supabase
    .from("integracoes_whatsapp")
    .select("tenant_id")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (existente) {
    const { data, error } = await supabase
      .from("integracoes_whatsapp")
      .update(payload)
      .eq("tenant_id", tenantId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("integracoes_whatsapp")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

/**
 * Envia uma mensagem via Evolution API v2.
 * Endpoint padrão da Evolution: POST {apiUrl}/message/sendText/{instancia}
 */
export async function enviarMensagemEvolution({ apiUrl, apiToken, instancia, numero, texto }) {
  if (!apiUrl || !apiToken || !numero || !texto) {
    throw new Error("Parâmetros insuficientes para envio WhatsApp");
  }

  // Limpa o número (apenas dígitos)
  let telLimpo = String(numero).replace(/\D/g, "");
  // Se não tiver DDI 55 do Brasil, adiciona
  if (telLimpo.length === 10 || telLimpo.length === 11) {
    telLimpo = `55${telLimpo}`;
  }

  // Normaliza URL da API
  const urlBase = apiUrl.replace(/\/+$/, "");
  const endpoint = instancia ? `${urlBase}/message/sendText/${instancia}` : `${urlBase}/message/sendText`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiToken,
    },
    body: JSON.stringify({
      number: telLimpo,
      text: texto,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Falha na Evolution API (${response.status}): ${errBody}`);
  }

  return await response.json();
}

/**
 * Dispara o lembrete de agendamento usando o template cadastrado.
 */
export async function dispararLembreteAutomatico({
  tenantId,
  nomeCliente,
  telefoneCliente,
  nomeProfissional,
  nomeServico,
  dataHorario,
}) {
  if (!tenantId || !telefoneCliente) return;

  const config = await fetchConfigWhatsapp(tenantId);
  if (!config || !config.ativo || !config.api_url || !config.api_token) {
    return; // Integração não configurada ou inativa
  }

  const dataObj = new Date(dataHorario);
  const dataFormatada = `${String(dataObj.getDate()).padStart(2, "0")}/${String(dataObj.getMonth() + 1).padStart(2, "0")}/${dataObj.getFullYear()}`;
  const horaFormatada = `${String(dataObj.getHours()).padStart(2, "0")}:${String(dataObj.getMinutes()).padStart(2, "0")}`;

  const template =
    config.mensagem_lembrete ||
    "Olá {cliente}, seu agendamento de {servico} com {profissional} está confirmado para {data} às {horario}.";

  const mensagemFinal = template
    .replace(/{cliente}/gi, nomeCliente || "Cliente")
    .replace(/{servico}/gi, nomeServico || "Atendimento")
    .replace(/{profissional}/gi, nomeProfissional || "nossa equipe")
    .replace(/{data}/gi, dataFormatada)
    .replace(/{horario}/gi, horaFormatada);

  try {
    await enviarMensagemEvolution({
      apiUrl: config.api_url,
      apiToken: config.api_token,
      instancia: config.api_url.split("/").pop(), // fallback caso venha no final da url
      numero: telefoneCliente,
      texto: mensagemFinal,
    });
  } catch (err) {
    console.warn("Aviso: disparo automático de WhatsApp falhou:", err.message);
  }
}
