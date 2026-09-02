/**
 * Helpers de data em horário local.
 *
 * `new Date().toISOString()` converte para UTC: depois das 21h em BRT (-03:00)
 * a data já é a do dia seguinte. Gravar ou filtrar com esse valor joga o
 * registro para fora do mês corrente — foi o que sumiu com vendas noturnas.
 * Estes helpers trabalham sempre no fuso do navegador e só convertem para UTC
 * na fronteira com o banco (colunas timestamptz).
 */

/** Data como "YYYY-MM-DD" no fuso local, para <input type="date">. */
export function toDateInputValue(d = new Date()) {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/**
 * Combina "YYYY-MM-DD" (local) com a hora de `ref` e devolve o instante em ISO.
 * Substitui a concatenação com offset fixo `-03:00`, que quebra no horário de
 * verão e em qualquer fuso diferente.
 */
export function dateInputToTimestamp(dateInput, ref = new Date()) {
  const [ano, mes, dia] = dateInput.split("-").map(Number);
  return new Date(
    ano,
    mes - 1,
    dia,
    ref.getHours(),
    ref.getMinutes(),
    0,
    0,
  ).toISOString();
}

/**
 * Intervalo de um mês local, em instantes UTC. `mesIndex` é 0-based;
 * `null` cobre o ano inteiro.
 */
export function localMonthRange(ano, mesIndex = null) {
  const inicio =
    mesIndex === null
      ? new Date(ano, 0, 1, 0, 0, 0, 0)
      : new Date(ano, mesIndex, 1, 0, 0, 0, 0);
  // Dia 0 do mês seguinte = último dia deste mês (cobre fevereiro e bissexto).
  const fim =
    mesIndex === null
      ? new Date(ano, 11, 31, 23, 59, 59, 999)
      : new Date(ano, mesIndex + 1, 0, 23, 59, 59, 999);
  return { inicio: inicio.toISOString(), fim: fim.toISOString() };
}

/** Intervalo da semana local corrente (domingo → sábado), em instantes UTC. */
export function localWeekRange(ref = new Date()) {
  const inicio = new Date(
    ref.getFullYear(),
    ref.getMonth(),
    ref.getDate() - ref.getDay(),
    0,
    0,
    0,
    0,
  );
  const fim = new Date(
    inicio.getFullYear(),
    inicio.getMonth(),
    inicio.getDate() + 6,
    23,
    59,
    59,
    999,
  );
  return { inicio: inicio.toISOString(), fim: fim.toISOString() };
}
