/**
 * Formata um valor numérico ou string de número para o formato de moeda brasileira (R$).
 * Ex: 1500 -> "R$ 1.500,00"
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "R$ 0,00";
  const num = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (isNaN(num)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
};

/**
 * Máscara dinâmica para input de moeda enquanto o usuário digita.
 * Transforma dígitos em valor de centavos e exibe formatado.
 * Ex: "1500" -> "R$ 15,00", "15000" -> "R$ 150,00"
 */
export const maskCurrencyInput = (value) => {
  if (!value) return "";
  const cleanValue = String(value).replace(/\D/g, "");
  if (!cleanValue) return "";
  const numberValue = Number(cleanValue) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numberValue);
};

/**
 * Converte um valor formatado de moeda (ou string qualquer) para float JS limpo.
 * Ex: "R$ 1.500,00" -> 1500.00
 */
export const parseCurrencyToNumber = (value) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  // Remove tudo que não for dígito
  const cleanValue = String(value).replace(/\D/g, "");
  if (!cleanValue) return 0;
  return Number(cleanValue) / 100;
};

/**
 * Máscara centralizada para telefone fixo ou celular (BR).
 * Ex: 11999999999 -> (11) 99999-9999
 */
export const applyPhoneMask = (value) => {
  if (!value) return "";
  const clean = String(value).replace(/\D/g, "");
  if (clean.length <= 2) return clean;
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
};
