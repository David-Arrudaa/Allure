/**
 * ============================================================================
 * CONFIGURAÇÃO DE FUNCIONALIDADES POR SALÃO (FEATURE TOGGLE MULTI-TENANT)
 * ============================================================================
 * 
 * Lista de tenant_ids (UUIDs) dos salões autorizados a acessar o Módulo de Cursos.
 * 
 * Para autorizar um salão:
 * Adicione o UUID dele no array abaixo.
 * 
 * Exemplo:
 * export const TENANTS_COM_CURSOS = [
 *   'b7e0d3fc-1234-5678-9abc-def012345678',
 * ];
 */
export const TENANTS_COM_CURSOS = [
  '2eb7f70a-0310-420a-92b1-b62403c4951e', // Kings
  '11111111-1111-1111-1111-111111111111', // GAB
  'f334805e-00ff-47f5-9612-59e98c45ded2', // Salão de teste
];

/**
 * Verifica se um determinado tenant possui acesso ao módulo de cursos.
 * @param {string|null|undefined} tenantId
 * @returns {boolean}
 */
export function temAcessoModuloCursos(tenantId) {
  if (!tenantId) return false;
  if (TENANTS_COM_CURSOS.includes("*")) return true;
  const cleanId = String(tenantId).trim().toLowerCase();
  const autorizado = TENANTS_COM_CURSOS.some(
    (id) => String(id).trim().toLowerCase() === cleanId
  );
  console.info("[Allure Cursos] Verificação de Acesso:", {
    tenantId,
    autorizado,
    tenantsAutorizados: TENANTS_COM_CURSOS,
  });
  return autorizado;
}

